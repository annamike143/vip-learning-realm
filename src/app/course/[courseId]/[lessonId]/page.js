// --- src/app/course/[courseId]/[lessonId]/page.js (THE DEFINITIVE FINAL REFACTOR) ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../hooks/useAuth';
import { database, functions } from '../../../lib/firebase';
import Image from 'next/image';

// --- WE NOW IMPORT OUR SINGLE, MASTER COMPONENT ---
import ChatInterface from '../../../components/ChatInterface';

import './lesson-page.css';
import '../../../components/ChatInterface.css'; // Import the new stylesheet

export default function CourseLessonPage({ params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();
    const [lessonData, setLessonData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockStatus, setUnlockStatus] = useState({ message: '', error: false });
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recitation'); // Default to recitation for learning flow

    useEffect(() => {
        if (!lessonId || !courseId) return;
        const courseRef = ref(database, `courses/${courseId}`);
        const unsubscribe = onValue(courseRef, (snapshot) => {
            const courseSnapshot = snapshot.val();
            setCourseData(courseSnapshot);
            let foundLesson = null;
            if (courseSnapshot?.modules) {
                for (const modId in courseSnapshot.modules) {
                    if (courseSnapshot.modules[modId]?.lessons?.[lessonId]) {
                        foundLesson = courseSnapshot.modules[modId].lessons[lessonId];
                        break;
                    }
                }
            }
            if (foundLesson) setLessonData(foundLesson); else setError('Lesson content not found.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [courseId, lessonId]);

    const handleUnlock = async () => {
        if (!user) return alert("You must be logged in.");
        if (!unlockCode.trim()) return setUnlockStatus({ message: 'Please enter a code.', error: true });
        setUnlockStatus({ message: 'Verifying code...', error: false });
        const unlockNextLesson = httpsCallable(functions, 'unlockNextLesson');
        try {
            const result = await unlockNextLesson({ courseId, currentLessonId: lessonId, unlockCode });
            setUnlockStatus({ message: result.data.message, error: false });
            if (result.data.nextLessonId) {
                setTimeout(() => { window.location.href = `/course/${courseId}/${result.data.nextLessonId}`; }, 2000);
            }
        } catch (error) {
            setUnlockStatus({ message: error.message, error: true });
        }
    };

    if (authLoading || loading) return <div className="loading-state">Loading Your Lesson...</div>;
    if (error || !lessonData || !courseData) return <div className="loading-state">{error || 'An error occurred.'}</div>;

    return (
        <div className="lesson-content-wrapper">
            <h2>{lessonData.title}</h2>
            <p>{lessonData.description}</p>
            <div className="video-container" dangerouslySetInnerHTML={{ __html: lessonData.videoEmbedCode || '' }} />

            <div className="interactive-zone">
                <div className="chat-tabs-container">
                    <div className="chat-tabs-header">
                        <button 
                            className={`chat-tab ${activeTab === 'recitation' ? 'active' : ''}`}
                            onClick={() => setActiveTab('recitation')}
                            role="tab"
                            aria-selected={activeTab === 'recitation'}
                            aria-controls="recitation-panel"
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') setActiveTab('qna');
                                if (e.key === 'ArrowLeft') setActiveTab('qna');
                            }}
                        >
                            <span className="tab-icon">🎓</span>
                            <span className="tab-title">Lesson Recitation</span>
                            <span className="tab-subtitle">Practice & Review</span>
                        </button>
                        <button 
                            className={`chat-tab ${activeTab === 'qna' ? 'active' : ''}`}
                            onClick={() => setActiveTab('qna')}
                            role="tab"
                            aria-selected={activeTab === 'qna'}
                            aria-controls="qna-panel"
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowRight') setActiveTab('recitation');
                                if (e.key === 'ArrowLeft') setActiveTab('recitation');
                            }}
                        >
                            <span className="tab-icon">💬</span>
                            <span className="tab-title">Course Q&A</span>
                            <span className="tab-subtitle">Get Help & Support</span>
                        </button>
                    </div>
                    <div className="chat-content-area">
                        {activeTab === 'recitation' && (
                            <div className="chat-panel active" role="tabpanel" id="recitation-panel" aria-labelledby="recitation-tab">
                                <div className="chat-panel-header">
                                    <h3>🎓 Lesson Recitation</h3>
                                    <p>Practice what you've learned and receive personalized feedback</p>
                                </div>
                                <ChatInterface 
                                    title="" 
                                    assistantId={lessonData.recitationAssistantId} 
                                    courseId={courseId} 
                                    lessonId={lessonId}
                                    chatType="recitation"
                                />
                            </div>
                        )}
                        {activeTab === 'qna' && (
                            <div className="chat-panel active" role="tabpanel" id="qna-panel" aria-labelledby="qna-tab">
                                <div className="chat-panel-header">
                                    <h3>💬 Course Q&A & Support</h3>
                                    <p>Ask questions about the course content or get technical support</p>
                                </div>
                                <ChatInterface 
                                    title="" 
                                    assistantId={courseData.courseConciergeAssistantId} 
                                    courseId={courseId}
                                    lessonId={lessonId}
                                    chatType="qna"
                                />
                            </div>
                        )}
                    </div>
                </div>
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
        </div>
    );
}