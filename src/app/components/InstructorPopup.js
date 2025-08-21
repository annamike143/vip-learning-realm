// --- src/app/components/InstructorPopup.js (Dynamic Lesson-Specific Instructor Message Popup) ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { useTheme } from './ThemeProvider';
import './InstructorPopup.css';

const InstructorPopup = ({ courseId, lessonId, onClose, user }) => {
    const { customBranding } = useTheme();
    const [message, setMessage] = useState('');
    const [instructorData, setInstructorData] = useState(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !lessonId) return;

        // Load lesson-specific instructor message
        const lessonRef = ref(database, `courses/${courseId}/modules`);
        const brandingRef = ref(database, `courses/${courseId}/branding`);

        const unsubLessons = onValue(lessonRef, (snapshot) => {
            const modules = snapshot.val();
            if (modules) {
                // Find the lesson with the matching lessonId
                let lessonMessage = '';
                Object.values(modules).forEach(module => {
                    if (module.lessons) {
                        Object.entries(module.lessons).forEach(([id, lesson]) => {
                            if (id === lessonId && lesson.instructorMessage) {
                                lessonMessage = lesson.instructorMessage;
                            }
                        });
                    }
                });
                
                setMessage(lessonMessage || 'Welcome to this lesson! Let\'s learn something amazing together.');
                setLoading(false);
            }
        });

        const unsubBranding = onValue(brandingRef, (snapshot) => {
            const brandingData = snapshot.val();
            setInstructorData(brandingData || {});
        });

        return () => {
            unsubLessons();
            unsubBranding();
        };
    }, [courseId, lessonId]);

    // Function to personalize message with user variables
    const personalizeMessage = (messageText, userData) => {
        if (!messageText || !userData) return messageText;
        
        const variables = {
            '{firstName}': userData.firstName || userData.displayName?.split(' ')[0] || 'Student',
            '{lastName}': userData.lastName || userData.displayName?.split(' ')[1] || '',
            '{fullName}': userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Student',
            '{email}': userData.email || ''
        };
        
        let personalizedMessage = messageText;
        Object.entries(variables).forEach(([variable, value]) => {
            personalizedMessage = personalizedMessage.replace(new RegExp(variable, 'g'), value);
        });
        
        return personalizedMessage;
    };

    useEffect(() => {
        if (!loading && message) {
            // Personalize the message with user data
            const personalizedMessage = personalizeMessage(message, user);
            
            // Show popup with slide-in animation
            setIsVisible(true);
            
            // Start typewriter effect after a short delay
            setTimeout(() => {
                setIsTyping(true);
                typewriterEffect(personalizedMessage);
            }, 500);
        }
    }, [loading, message, user]);

    const typewriterEffect = (textToType) => {
        let index = 0;
        const typingSpeed = 50; // milliseconds per character
        
        const typeInterval = setInterval(() => {
            setDisplayedText(textToType.substring(0, index + 1));
            index++;
            
            if (index >= textToType.length) {
                clearInterval(typeInterval);
                setIsTyping(false);
                
                // Auto-fade after 7 seconds
                setTimeout(() => {
                    fadeOut();
                }, 7000);
            }
        }, typingSpeed);
    };

    const fadeOut = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300); // Match CSS transition duration
    };

    const handleManualClose = () => {
        fadeOut();
    };

    if (loading || !message) return null;

    const instructorName = instructorData?.instructorName || 
        customBranding?.instructorName || 
        'Your Instructor';

    const instructorAvatar = instructorData?.instructorPhoto || 
        customBranding?.instructorPhoto || 
        null;

    return (
        <div className={`instructor-popup-overlay ${isVisible ? 'visible' : ''}`}>
            <div className={`instructor-popup ${isVisible ? 'slide-in' : ''}`}>
                <button className="popup-close-btn" onClick={handleManualClose}>
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
                        <span className="instructor-role">Course Instructor</span>
                    </div>
                    <div className="typing-indicator">
                        {isTyping && (
                            <div className="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="popup-content">
                    <div className="message-bubble">
                        <p className="message-text">
                            {displayedText}
                            {isTyping && <span className="cursor">|</span>}
                        </p>
                    </div>
                </div>
                
                <div className="popup-footer">
                    <span className="lesson-message-label">Lesson Message</span>
                </div>
            </div>
        </div>
    );
};

export default InstructorPopup;
