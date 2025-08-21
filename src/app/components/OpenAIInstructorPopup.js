// --- Simplified Instructor Popup for OpenAI Integration ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { simplifiedAI } from '../lib/simplifiedAI';
import { useTheme } from './ThemeProvider';
import './InstructorPopup.css';

export default function OpenAIInstructorPopup({ courseId, lessonId, user, onClose }) {
    const { customBranding } = useTheme();
    const [message, setMessage] = useState('');
    const [displayMessage, setDisplayMessage] = useState('');
    const [branding, setBranding] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !user) return;

        loadInstructorMessage();
    }, [courseId, lessonId, user]);

    const loadInstructorMessage = async () => {
        try {
            // Load branding data
            const brandingRef = ref(database, `courses/${courseId}/branding`);
            const lessonRef = ref(database, `courses/${courseId}/modules`);

            // Get branding
            const unsubBranding = onValue(brandingRef, (snapshot) => {
                const brandingData = snapshot.val();
                setBranding(brandingData);
            });

            // Get lesson-specific message
            const unsubLesson = onValue(lessonRef, async (snapshot) => {
                const modules = snapshot.val();
                let lessonMessage = '';
                
                if (modules) {
                    // Find the lesson message
                    Object.values(modules).forEach(module => {
                        if (module.lessons) {
                            Object.entries(module.lessons).forEach(([id, lesson]) => {
                                if (id === lessonId && lesson.instructorMessage) {
                                    lessonMessage = lesson.instructorMessage;
                                }
                            });
                        }
                    });
                }

                // Use lesson message or fallback to general branding message
                const finalMessage = lessonMessage || brandingData?.instructorMessage || 
                    'Welcome, {firstName}! Ready to learn something amazing today?';

                // Get user context for personalization
                const userContext = await simplifiedAI.getUserContextForAI(user.uid);
                
                // Personalize the message
                const personalizedMessage = simplifiedAI.personalizeInstructorMessage(finalMessage, userContext);
                
                setMessage(personalizedMessage);
                setLoading(false);
            });

            // Track engagement
            await simplifiedAI.trackEngagement(user.uid, {
                type: 'lesson_start',
                courseId,
                lessonId
            });

            return () => {
                unsubBranding();
                unsubLesson();
            };
        } catch (error) {
            console.error('Error loading instructor message:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && message) {
            setIsVisible(true);
            
            setTimeout(() => {
                typeMessage(message);
            }, 500);
        }
    }, [loading, message]);

    const typeMessage = (text) => {
        setIsTyping(true);
        setDisplayMessage('');
        
        let index = 0;
        const interval = setInterval(() => {
            setDisplayMessage(text.slice(0, index + 1));
            index++;
            
            if (index >= text.length) {
                clearInterval(interval);
                setIsTyping(false);
                
                // Auto-fade after 7 seconds
                setTimeout(() => {
                    fadeOut();
                }, 7000);
            }
        }, 50);
    };

    const fadeOut = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 500);
    };

    if (loading || !message) return null;

    const instructorName = branding?.instructor?.name || 
        customBranding?.instructorName || 
        'Your Instructor';

    const instructorAvatar = branding?.instructor?.avatarUrl || 
        customBranding?.instructorPhoto || 
        null;

    return (
        <div className={`instructor-popup-overlay ${isVisible ? 'visible' : ''}`}>
            <div className={`instructor-popup simplified ${isVisible ? 'slide-in' : ''}`}>
                <button className="popup-close-btn" onClick={fadeOut}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                
                <div className="popup-header">
                    <div className="instructor-avatar">
                        {instructorAvatar ? (
                            <img src={instructorAvatar} alt={instructorName} />
                        ) : (
                            <div className="avatar-placeholder">
                                {instructorName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="instructor-info">
                        <h4 className="instructor-name">{instructorName}</h4>
                        <span className="instructor-role">
                            {branding?.instructor?.title || 'Course Instructor'}
                        </span>
                    </div>
                </div>
                
                <div className="popup-content">
                    <div className="message-bubble simplified">
                        <div className="message-text">
                            {displayMessage}
                            {isTyping && <span className="cursor">|</span>}
                        </div>
                    </div>
                </div>
                
                <div className="popup-footer">
                    <span className="personalization-info">
                        ✨ Personalized Message
                    </span>
                </div>
            </div>
        </div>
    );
}
