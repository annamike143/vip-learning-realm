// --- Enhanced AI-Powered Instructor Popup ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { aiPersonalization } from '../lib/aiPersonalization';
import { useTheme } from './ThemeProvider';
import './InstructorPopup.css';

export default function EnhancedInstructorPopup({ courseId, lessonId, user, onClose }) {
    const { customBranding } = useTheme();
    const [message, setMessage] = useState('');
    const [displayMessage, setDisplayMessage] = useState('');
    const [branding, setBranding] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !user) return;

        // Load branding and lesson data
        const brandingRef = ref(database, `courses/${courseId}/branding`);
        const lessonRef = ref(database, `courses/${courseId}/modules`);

        const unsubBranding = onValue(brandingRef, (snapshot) => {
            const brandingData = snapshot.val();
            setBranding(brandingData);
        });

        const unsubLesson = onValue(lessonRef, (snapshot) => {
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
                
                setMessage(lessonMessage || brandingData?.instructorMessage || '');
                setLoading(false);
            }
        });

        // Load user profile for AI personalization
        loadUserProfile();

        return () => {
            unsubBranding();
            unsubLesson();
        };
    }, [courseId, lessonId, user]);

    const loadUserProfile = async () => {
        try {
            // Get or create enhanced user profile
            const profile = await aiPersonalization.enrichUserProfile(user.uid, {
                firstName: user.displayName?.split(' ')[0] || 'Student',
                lastName: user.displayName?.split(' ')[1] || '',
                email: user.email || ''
            });
            
            setUserProfile(profile);

            // Track lesson start for behavioral analytics
            await aiPersonalization.trackLearningSession(user.uid, {
                courseId,
                lessonId,
                startTime: new Date().toISOString(),
                eventType: 'lesson_start',
                interactions: [],
                engagementEvents: [{ type: 'lesson_access', timestamp: Date.now() }]
            });

            // Generate AI insights for this user
            const insights = await generateAIInsights(profile);
            setAiInsights(insights);

        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to basic user data
            setUserProfile({
                demographics: {
                    firstName: user.displayName?.split(' ')[0] || 'Student',
                    lastName: user.displayName?.split(' ')[1] || '',
                    email: user.email || ''
                }
            });
        }
    };

    const generateAIInsights = async (profile) => {
        // AI-powered insights based on user profile
        const insights = {
            personalizedGreeting: await generatePersonalizedGreeting(profile),
            learningTip: generateLearningTip(profile),
            motivationalMessage: generateMotivationalMessage(profile),
            nextRecommendation: generateNextRecommendation(profile)
        };
        
        return insights;
    };

    const generatePersonalizedGreeting = async (profile) => {
        // Use AI personalization engine
        return await aiPersonalization.generatePersonalizedContent(
            user.uid, 
            'lesson_introduction'
        );
    };

    const generateLearningTip = (profile) => {
        const tips = {
            beginner: "💡 Take your time and don't hesitate to replay sections you find challenging.",
            intermediate: "🎯 Focus on practical application - try to think of real-world examples as you learn.",
            advanced: "🚀 Challenge yourself to think critically about how this connects to your expertise.",
            expert: "🧠 Consider how you might teach this concept to others - it deepens understanding."
        };
        
        const skillLevel = profile?.careerProfile?.skillLevel || 'beginner';
        return tips[skillLevel] || tips.beginner;
    };

    const generateMotivationalMessage = (profile) => {
        const timeOfDay = new Date().getHours();
        const goals = profile?.careerProfile?.careerGoals || [];
        const primaryGoal = goals[0] || 'achieve your goals';
        
        if (timeOfDay < 12) {
            return `🌅 Great way to start your day! Every lesson brings you closer to ${primaryGoal}.`;
        } else if (timeOfDay < 17) {
            return `☀️ Afternoon learning session! You're making excellent progress toward ${primaryGoal}.`;
        } else {
            return `🌙 Evening study time shows real dedication! Keep pushing toward ${primaryGoal}.`;
        }
    };

    const generateNextRecommendation = (profile) => {
        const completionRate = profile?.behaviorMetrics?.completionRate || 0;
        
        if (completionRate > 0.8) {
            return "🎓 You're doing amazing! Consider exploring advanced topics or sharing your knowledge with others.";
        } else if (completionRate > 0.5) {
            return "📈 Solid progress! Try setting aside dedicated study time to maintain momentum.";
        } else {
            return "🎯 Remember: consistency beats intensity. Even 15 minutes daily makes a huge difference!";
        }
    };

    useEffect(() => {
        if (!loading && message && userProfile && aiInsights) {
            const personalizedMessage = personalizeMessage(message, userProfile, aiInsights);
            setIsVisible(true);
            
            setTimeout(() => {
                typeMessage(personalizedMessage);
            }, 500);
        }
    }, [loading, message, userProfile, aiInsights]);

    const personalizeMessage = (template, profile, insights) => {
        const firstName = profile?.demographics?.firstName || 'Student';
        const lastName = profile?.demographics?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = profile?.demographics?.email || '';
        const currentRole = profile?.careerProfile?.currentRole || '';
        const primaryGoal = profile?.careerProfile?.careerGoals?.[0] || 'your learning goals';

        // Enhanced personalization with AI insights
        let personalizedMsg = template
            .replace(/\{firstName\}/g, firstName)
            .replace(/\{lastName\}/g, lastName)
            .replace(/\{fullName\}/g, fullName)
            .replace(/\{email\}/g, email)
            .replace(/\{currentRole\}/g, currentRole)
            .replace(/\{primaryGoal\}/g, primaryGoal);

        // Add AI-generated content if template is basic or short
        if (personalizedMsg.length < 50 || !personalizedMsg.includes(firstName)) {
            personalizedMsg = `${insights.personalizedGreeting || `Hello ${firstName}!`}\n\n${personalizedMsg}\n\n${insights.learningTip}\n\n${insights.motivationalMessage}`;
        }

        return personalizedMsg;
    };

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
                
                // Auto-fade after 10 seconds (extended for longer AI messages)
                setTimeout(() => {
                    fadeOut();
                }, 10000);
            }
        }, 30); // Slightly slower for better readability
    };

    const fadeOut = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 500);
    };

    if (loading || !userProfile) return null;

    const instructorName = branding?.instructor?.name || 
        customBranding?.instructorName || 
        'Your Instructor';

    const instructorAvatar = branding?.instructor?.avatarUrl || 
        customBranding?.instructorPhoto || 
        null;

    return (
        <div className={`instructor-popup-overlay ${isVisible ? 'visible' : ''}`}>
            <div className={`instructor-popup enhanced ${isVisible ? 'slide-in' : ''}`}>
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
                    <div className="ai-indicator">
                        <span className="ai-badge">🤖 AI Enhanced</span>
                    </div>
                </div>
                
                <div className="popup-content">
                    <div className="message-bubble enhanced">
                        <div className="message-text">
                            {displayMessage.split('\n').map((line, index) => (
                                <p key={index} className={line.includes('🌅') || line.includes('☀️') || line.includes('🌙') ? 'motivational' : ''}>
                                    {line}
                                </p>
                            ))}
                            {isTyping && <span className="cursor">|</span>}
                        </div>
                    </div>
                    
                    {aiInsights && !isTyping && (
                        <div className="ai-insights">
                            <div className="insight-item">
                                <span className="insight-icon">🎯</span>
                                <span className="insight-text">{aiInsights.nextRecommendation}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="popup-footer">
                    <span className="personalization-info">
                        ✨ Personalized for {userProfile?.demographics?.firstName || 'You'}
                    </span>
                    <span className="lesson-indicator">Lesson {lessonId}</span>
                </div>
            </div>
        </div>
    );
}
