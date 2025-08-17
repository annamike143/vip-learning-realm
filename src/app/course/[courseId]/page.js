// --- src/app/course/[courseId]/[lessonId]/page.js (v2.1 - DEFINITIVE UNCOLLAPSED) ---
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../hooks/useAuth';
import { database, functions } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import './lesson-page.css';

// --- A dedicated, reusable Chat Component ---
const ChatInterface = ({ title, assistantId, threadId, user, courseId }) => {
    // For Sprint 3.4, this is a UI placeholder.
    // The full AI logic will be integrated in our next evolution.
    return (
        <div className="chat-portal">
            <h3>{title}</h3>
            <div className="messages-display">
                <div className="message assistant">
                    <span>{title === 'Lesson Recitation' ? 'AI Coach' : 'AI Concierge'}</span>
                    <p>The AI chat interface will be activated here. This is where you will interact with the AI to get your unlock code or ask questions.</p>
                </div>
            </div>
            <form className="message-form">
                <input type="text" placeholder="Your conversation begins here..." disabled />
                <button type="submit" disabled>Send</button>
            </form>
        </div>
    );
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
        if (!lessonId || !courseId) return;
        const lessonRef = ref(database, `courses/${courseId}`);
        const unsubscribe = onValue(lessonRef, (snapshot) => {
            const courseData = snapshot.val();
            let foundLesson = null;
            if (courseData?.modules) {
                for (const modId in courseData.modules) {
                    if (courseData.modules[modId]?.lessons?.[lessonId]) {
                        foundLesson = courseData.modules[modId].lessons[lessonId];
                        break;
                    }
                }
            }
            if (foundLesson) {
                setLessonData(foundLesson);
            } else {
                setError('Lesson content not found.');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [courseId, lessonId]);

    useEffect(() => {
        if (lessonData?.chatbotEmbedCode) {
            // Clean up any old script to prevent duplicates when navigating between lessons
            const oldScript = document.getElementById('smartbot-chatbot-script');
            if (oldScript) oldScript.remove();
            
            // Create a new script element from the embed code string
            const scriptContainer = document.createElement('div');
            scriptContainer.innerHTML = lessonData.chatbotEmbedCode;
            const newScript = scriptContainer.firstChild;
            
            // Append the new script to the body to activate the chatbot
            if (newScript) {
                newScript.id = 'smartbot-chatbot-script';
                document.body.appendChild(newScript);
            }
        }
    }, [lessonData]);

    const handleUnlock = async () => {
        if (!user) return alert("You must be logged in.");
        if (!unlockCode.trim()) return setUnlockStatus({ message: 'Please enter a code.', error: true });
        
        setUnlockStatus({ message: 'Verifying code...', error: false });
        const unlockNextLesson = httpsCallable(functions, 'unlockNextLesson');
        try {
            const result = await unlockNextLesson({ courseId, currentLessonId: lessonId, unlockCode });
            setUnlockStatus({ message: result.data.message, error: false });
            if (result.data.nextLessonId) {
                setTimeout(() => {
                    window.location.href = `/course/${courseId}/${result.data.nextLessonId}`;
                }, 2000); // Wait 2 seconds before redirecting
            }
        } catch (error) {
            setUnlockStatus({ message: error.message, error: true });
        }
    };

    if (authLoading || loading) return <div className="loading-state">Loading Your Lesson...</div>;
    if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/';
        return null;
    }
    if (error || !lessonData) return <div className="loading-state">{error || 'An unexpected error occurred.'}</div>;

    return (
        <div className="lesson-content-wrapper">
            <h2>{lessonData.title}</h2>
            <p>{lessonData.description}</p>
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
                    <ChatInterface title="Course Q&A / Support" courseId={courseId} user={user} />
                </div>
            </div>
        </div>
    );
}