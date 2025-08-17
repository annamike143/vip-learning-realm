// --- src/app/course/[courseId]/[lessonId]/page.js (v2.0 - Full AI Integration) ---
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../hooks/useAuth';
import { database, functions } from '../../../lib/firebase';
import Link from 'next/link';
import './lesson-page.css';

// --- NEW: A dedicated, reusable Chat Component ---
const ChatInterface = ({ title, assistantId, threadId, user }) => {
    // This is a placeholder for the UI. The full AI logic will be a future integration.
    // For now, we are building the interface that will house the AI.
    return (
        <div className="chat-portal">
            <h3>{title}</h3>
            <div className="messages-display">
                <div className="message assistant"><span>{title}</span><p>The AI chat interface will be activated here.</p></div>
            </div>
            <form className="message-form">
                <input type="text" placeholder="Your conversation begins here..." disabled />
                <button type="submit" disabled>Send</button>
            </form>
        </div>
    );
};

const QnaPortal = ({ courseId, user }) => {
    // ... (This component will be merged into the new chat interface logic later)
    // For now, we keep it simple to focus on the layout.
    return <ChatInterface title="Course Q&A / Support" />;
};


export default function CourseLessonPage({ params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();
    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockStatus, setUnlockStatus] = useState({ message: '', error: false });
    const [error, setError] = useState(null);

    useEffect(() => {
        // ... (fetching lesson data logic is the same)
    }, [lessonId]);
    
    const handleUnlock = async () => {
        // ... (unlock logic is the same)
    };

    if (authLoading || loading) return <div className="loading-state">Loading Lesson...</div>;
    if (!user) { if (typeof window !== 'undefined') window.location.href = '/'; return null; }
    if (error || !lessonData) return <div className="loading-state">{error || 'An error occurred.'}</div>;

    return (
        <div>
            <header className="lesson-header">
                <div className="container">
                    <Link href="/" className="back-to-dash">← Back to Dashboard</Link>
                </div>
            </header>
            <main className="lesson-container">
                <div className="lesson-content">
                    <h1>{lessonData.title}</h1>
                    <p className="lesson-description">{lessonData.description}</p>
                    
                    <div className="video-container" dangerouslySetInnerHTML={{ __html: lessonData.videoEmbedCode || '' }} />

                    <div className="interactive-zone">
                        <div className="recitation-container">
                            <ChatInterface title="Lesson Recitation" assistantId={lessonData.recitationAssistantId} user={user} />
                            <div className="unlock-gate">
                                <h3>Ready to Proceed?</h3>
                                <p>After completing the AI recitation, enter the code you received to unlock the next lesson.</p>
                                <div className="unlock-form">
                                    <input type="text" value={unlockCode} onChange={e => setUnlockCode(e.target.value)} placeholder="Enter Unlock Code" />
                                    <button onClick={handleUnlock}>Unlock</button>
                                </div>
                                {unlockStatus.message && <p className={`status-message ${unlockStatus.error ? 'error' : 'success'}`}>{unlockStatus.message}</p>}
                            </div>
                        </div>
                        <div className="qna-container">
                            <QnaPortal courseId={courseId} user={user} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}