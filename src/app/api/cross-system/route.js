// --- Cross-System Communication API for Learning Realm ---
import { NextResponse } from 'next/server';
import { database } from '../../lib/firebase';
import { ref, get, set, push, serverTimestamp } from 'firebase/database';

// Helper function to sync user progress to command center
async function syncUserProgressToCommandCenter(userId, progressData) {
    try {
        // Call command center API to sync progress
        const commandCenterUrl = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL || 'http://localhost:3001';
        
        const response = await fetch(`${commandCenterUrl}/api/cross-system`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync-user-progress',
                data: { userId, progressData }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to sync to command center:', error);
        return false;
    }
}

// Helper function to notify admin in command center
async function notifyCommandCenterAdmin(type, message, metadata = {}) {
    try {
        const commandCenterUrl = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL || 'http://localhost:3001';
        
        const response = await fetch(`${commandCenterUrl}/api/cross-system`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'notify-admin',
                data: { type, message, metadata }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to notify command center:', error);
        return false;
    }
}

export async function POST(request) {
    try {
        const { action, data } = await request.json();

        switch (action) {
            case 'report-user-progress':
                // When user completes a lesson, sync progress to command center
                const { userId, courseId, lessonId, progressData } = data;
                
                if (!userId || !courseId || !lessonId) {
                    return NextResponse.json({ 
                        error: 'userId, courseId, and lessonId required' 
                    }, { status: 400 });
                }

                // Update local progress
                const progressRef = ref(database, `users/${userId}/enrollments/${courseId}/progress`);
                await set(progressRef, {
                    ...progressData,
                    lastUpdated: serverTimestamp()
                });

                // Sync to command center (non-blocking)
                syncUserProgressToCommandCenter(userId, {
                    courseId,
                    lessonId,
                    ...progressData
                });

                return NextResponse.json({ 
                    success: true, 
                    message: 'Progress updated and synced' 
                });

            case 'report-system-event':
                // Report important system events to command center
                const { eventType, message, metadata } = data;
                
                // Log locally
                const eventRef = ref(database, 'system-events');
                await push(eventRef, {
                    type: eventType,
                    message,
                    metadata: metadata || {},
                    timestamp: serverTimestamp(),
                    source: 'learning-realm'
                });

                // Notify command center if it's a critical event
                const criticalEvents = ['user_error', 'system_failure', 'security_issue'];
                if (criticalEvents.includes(eventType)) {
                    notifyCommandCenterAdmin(eventType, message, metadata);
                }

                return NextResponse.json({ 
                    success: true, 
                    message: 'Event reported' 
                });

            case 'request-admin-help':
                // Student requests help from admin
                const { studentId, courseId: helpCourseId, lessonId: helpLessonId, helpMessage } = data;
                
                // Store help request locally
                const helpRef = ref(database, `help-requests/${studentId}`);
                await push(helpRef, {
                    courseId: helpCourseId,
                    lessonId: helpLessonId,
                    message: helpMessage,
                    timestamp: serverTimestamp(),
                    status: 'pending'
                });

                // Notify admin in command center
                notifyCommandCenterAdmin('help_request', 
                    `Student needs help in course ${helpCourseId}`, 
                    { studentId, courseId: helpCourseId, lessonId: helpLessonId, message: helpMessage }
                );

                return NextResponse.json({ 
                    success: true, 
                    message: 'Help request sent to admin' 
                });

            case 'update-system-health':
                // Report system health metrics
                const { metrics } = data;
                
                const healthRef = ref(database, 'system-health/learning-realm');
                await set(healthRef, {
                    status: 'healthy',
                    metrics: metrics || {},
                    lastUpdate: serverTimestamp()
                });

                // Also update command center
                const commandCenterUrl = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL || 'http://localhost:3001';
                fetch(`${commandCenterUrl}/api/cross-system`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update-system-status',
                        data: { system: 'learning-realm', status: 'healthy', metrics }
                    })
                }).catch(console.error);

                return NextResponse.json({ 
                    success: true, 
                    message: 'System health updated' 
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Cross-system API error:', error);
        return NextResponse.json({ 
            error: 'Failed to process request',
            details: error.message 
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'health':
                return NextResponse.json({
                    success: true,
                    status: 'healthy',
                    system: 'learning-realm',
                    timestamp: new Date().toISOString()
                });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Cross-system API GET error:', error);
        return NextResponse.json({ 
            error: 'Failed to process request',
            details: error.message 
        }, { status: 500 });
    }
}
