// --- Enhanced Lesson Page (v3.0 - Scroll Issue Fixed) ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { database, functions } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';

// Import components
import LessonContent from '../../../components/LessonContent';
import ChatInterface from '../../../components/ChatInterface';
import LessonNavigation from '../../../components/LessonNavigation';
import InstructorMessage from '../../../components/InstructorMessage';
import OpenAIInstructorPopup from '../../../components/OpenAIInstructorPopup';
import StudentDataPod from '../../../components/StudentDataPod';
import EnhancedFooter from '../../../components/EnhancedFooter';
import ResourcesTab from '../../../components/ResourcesTab';
import { getNavigationLessons } from '../../../utils/progressUtils';
import { simplifiedAI, getAIContext } from '../../../lib/simplifiedAI';
import SEOHead, { seoConfigs, generateLessonStructuredData, generateCourseStructuredData } from '../../../shared/components/SEOHead';

// Import styles
import './lesson-page.css';
import '../../../components/LessonContent.css';
import '../../../components/ChatInterface.css';
import '../../../components/LessonNavigation.css';
import '../../../components/InstructorMessage.css';
import '../../../components/InstructorPopup.css';
import '../../../components/StudentDataPod.css';
import '../../../components/EnhancedFooter.css';

export default function CourseLessonPage({ params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();
    const [lessonData, setLessonData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [moduleData, setModuleData] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockStatus, setUnlockStatus] = useState({ message: '', error: false });
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recitation');
    const [nextLessonToNavigate, setNextLessonToNavigate] = useState(null);
    const [showInstructorPopup, setShowInstructorPopup] = useState(false);

    // FIXED: Proper scroll management without aggressive blocking
    useEffect(() => {
        // Only disable browser scroll restoration, don't block all scrolling
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        
        // Set initial scroll position to top on lesson load
        window.scrollTo(0, 0);
        
        return () => {
            // Restore scroll restoration on unmount
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
        };
    }, [lessonId]); // Only run when lesson changes

    // Initialize AI user session and profile
    const initializeUserSession = async () => {
        try {
            // Get existing user profile from database first to preserve firstName/lastName
            const userProfileRef = ref(database, `users/${user.uid}/profile`);
            const profileSnapshot = await get(userProfileRef);
            const existingProfile = profileSnapshot.val() || {};
            
            // Use existing firstName/lastName if available, otherwise parse displayName as fallback
            const firstName = existingProfile.firstName || user.displayName?.split(' ')[0] || 'Student';
            const lastName = existingProfile.lastName || user.displayName?.split(' ')[1] || '';
            
            // Enrich user profile without overwriting existing firstName/lastName data
            await simplifiedAI.enrichUserProfile(user.uid, {
                firstName: firstName,
                lastName: lastName,
                email: user.email || existingProfile.email || '',
                newSession: true // Track that this is a new lesson session
            });

            // Track lesson engagement
            await simplifiedAI.trackEngagement(user.uid, {
                type: 'lesson_start',
                courseId,
                lessonId
            });

            // Show instructor popup after brief delay
            setTimeout(() => {
                setShowInstructorPopup(true);
            }, 1500);

            // Log user context for OpenAI
            const userContext = await getAIContext(user.uid);
            console.log('🤖 User Context for OpenAI:', userContext);

        } catch (error) {
            console.error('Error initializing AI session:', error);
            // Fallback popup
            setTimeout(() => {
                setShowInstructorPopup(true);
            }, 1500);
        }
    };

    // FIXED: Smooth scroll to unlock section without conflicts
    const handleScrollToUnlock = () => {
        // First activate recitation tab
        setActiveTab('recitation');
        
        // Use smooth scroll to unlock section
        setTimeout(() => {
            const unlockSection = document.querySelector('.unlock-gate-section');
            if (unlockSection) {
                unlockSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 100); // Small delay to ensure tab switch completes
    };

    // Handle navigation request after unlock
    const handleNavigateToNext = (nextLessonId) => {
        setNextLessonToNavigate(nextLessonId);
    };

    useEffect(() => {
        if (!lessonId || !courseId || !user) return;
        
        const courseRef = ref(database, `courses/${courseId}`);
        const progressRef = ref(database, `users/${user.uid}/enrollments/${courseId}/progress`);
        
        const unsubscribeCourse = onValue(courseRef, (snapshot) => {
            const courseSnapshot = snapshot.val();
            setCourseData(courseSnapshot);
            let foundLesson = null;
            let foundModule = null;
            if (courseSnapshot?.modules) {
                for (const modId in courseSnapshot.modules) {
                    if (courseSnapshot.modules[modId]?.lessons?.[lessonId]) {
                        foundLesson = courseSnapshot.modules[modId].lessons[lessonId];
                        foundModule = courseSnapshot.modules[modId];
                        break;
                    }
                }
            }
            if (foundLesson) {
                setLessonData(foundLesson);
                setModuleData(foundModule);
                
                // Initialize AI user profile and trigger popup
                if (foundLesson && user) {
                    initializeUserSession();
                }
            } else {
                setError('Lesson content not found.');
            }
            setLoading(false);
        });

        const unsubscribeProgress = onValue(progressRef, (snapshot) => {
            setUserProgress(snapshot.val());
        });

        return () => {
            unsubscribeCourse();
            unsubscribeProgress();
        };
    }, [courseId, lessonId, user]);

    const handleUnlock = async () => {
        if (!user) return alert("You must be logged in.");
        if (!unlockCode.trim()) return setUnlockStatus({ message: 'Please enter a code.', error: true });
        
        setUnlockStatus({ message: 'Verifying code...', error: false });
        const unlockNextLesson = httpsCallable(functions, 'unlockNextLesson');
        
        try {
            const result = await unlockNextLesson({ courseId, currentLessonId: lessonId, unlockCode });
            setUnlockStatus({ message: result.data.message, error: false });
            
            if (result.data.nextLessonId) {
                // Clear the unlock code
                setUnlockCode('');
                
                // Show success message with countdown
                setUnlockStatus({ 
                    message: `🎉 Success! Redirecting to next lesson in 3 seconds...`, 
                    error: false 
                });
                
                // Navigate after delay
                setTimeout(() => {
                    // Use the stored next lesson ID or the one from the result
                    const targetLessonId = nextLessonToNavigate || result.data.nextLessonId;
                    window.location.href = `/course/${courseId}/${targetLessonId}`;
                }, 3000);
            }
        } catch (error) {
            setUnlockStatus({ message: error.message, error: true });
        }
    };

    if (authLoading || loading) {
        return (
            <div className="lesson-loading">
                <div className="loading-spinner"></div>
                <p>Loading lesson content...</p>
            </div>
        );
    }
    
    if (error || !lessonData || !courseData) {
        return (
            <div className="lesson-error">
                <h2>Lesson Not Found</h2>
                <p>{error || 'An error occurred.'}</p>
                <button onClick={() => window.history.back()}>← Go Back</button>
            </div>
        );
    }

    // Generate SEO data for lesson
    const lessonSEO = seoConfigs.lesson(lessonData?.title || 'Lesson', courseData?.title || 'Course');
    const lessonStructuredData = generateLessonStructuredData(
        { title: lessonData?.title, description: lessonData?.content?.substring(0, 200) },
        { title: courseData?.title }
    );

    return (
        <>
            <SEOHead 
                {...lessonSEO}
                structuredData={lessonStructuredData}
            />
            {/* Main Lesson Content */}
            <LessonContent 
                lessonData={lessonData}
                moduleData={moduleData}
                courseData={courseData}
                courseId={courseId}
                lessonId={lessonId}
            />

            {/* Lesson Navigation */}
            <LessonNavigation 
                courseData={courseData}
                userProgress={userProgress}
                courseId={courseId}
                currentLessonId={lessonId}
                onScrollToUnlock={handleScrollToUnlock}
                onNavigateToNext={handleNavigateToNext}
            />

            {/* Student Progress Pod */}
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <StudentDataPod 
                    courseId={courseId}
                    currentLessonId={lessonId}
                />
            </div>

            {/* Interactive Learning Section */}
            <div className="interactive-learning-section">
                <div className="section-header">
                    <h2 className="section-title">Interactive Learning</h2>
                    <p className="section-description">
                        Engage with AI tutors for personalized practice and get answers to your questions
                    </p>
                </div>

                <div className="kajabi-chat-container">
                    <div className="chat-tabs-header">
                        <button 
                            className={`chat-tab ${activeTab === 'recitation' ? 'active' : ''}`}
                            onClick={() => setActiveTab('recitation')}
                            role="tab"
                            aria-selected={activeTab === 'recitation'}
                        >
                            <div className="tab-icon">🎓</div>
                            <div className="tab-content">
                                <span className="tab-title">AI Recitation</span>
                                <span className="tab-subtitle">Practice & Review</span>
                            </div>
                        </button>
                        <button 
                            className={`chat-tab ${activeTab === 'qna' ? 'active' : ''}`}
                            onClick={() => setActiveTab('qna')}
                            role="tab"
                            aria-selected={activeTab === 'qna'}
                        >
                            <div className="tab-icon">💬</div>
                            <div className="tab-content">
                                <span className="tab-title">Course Q&A</span>
                                <span className="tab-subtitle">Get Help & Support</span>
                            </div>
                        </button>
                        <button 
                            className={`chat-tab ${activeTab === 'resources' ? 'active' : ''}`}
                            onClick={() => setActiveTab('resources')}
                            role="tab"
                            aria-selected={activeTab === 'resources'}
                        >
                            <div className="tab-icon">📚</div>
                            <div className="tab-content">
                                <span className="tab-title">Resources</span>
                                <span className="tab-subtitle">Downloads & Files</span>
                            </div>
                        </button>
                    </div>
                    
                    <div className="chat-content-area">
                        {activeTab === 'recitation' && (
                            <div className="chat-panel active">
                                <div className="chat-panel-header">
                                    <h3>🎓 AI Recitation Practice</h3>
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
                            <div className="chat-panel active">
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
                        {activeTab === 'resources' && (
                            <div className="chat-panel active">
                                <div className="chat-panel-header">
                                    <h3>📚 Lesson Resources</h3>
                                    <p>Download files, guides, and materials for this lesson</p>
                                </div>
                                <ResourcesTab lessonData={lessonData} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Unlock Gate - Enhanced with Next Lesson Info */}
                <div className="unlock-gate-section">
                    <div className="unlock-content">
                        <div className="unlock-icon">🔓</div>
                        <h3>Ready to Proceed?</h3>
                        {(() => {
                            const { nextLesson } = getNavigationLessons(lessonId, courseData);
                            return nextLesson ? (
                                <div className="next-lesson-preview">
                                    <p>Complete the AI recitation above to unlock:</p>
                                    <div className="next-lesson-card">
                                        <div className="next-lesson-info">
                                            <span className="next-lesson-label">Next Lesson</span>
                                            <span className="next-lesson-title">{nextLesson.lesson.title}</span>
                                        </div>
                                        <div className="unlock-arrow">→</div>
                                    </div>
                                </div>
                            ) : (
                                <p>You've completed all lessons in this course! 🎉</p>
                            );
                        })()}
                        <div className="unlock-form">
                            <input 
                                type="text" 
                                value={unlockCode} 
                                onChange={e => setUnlockCode(e.target.value)} 
                                placeholder="Enter Unlock Code"
                                className="unlock-input"
                            />
                            <button 
                                onClick={handleUnlock}
                                className="unlock-button"
                                disabled={!unlockCode.trim()}
                            >
                                Unlock Next Lesson
                            </button>
                        </div>
                        {unlockStatus.message && (
                            <div className={`status-message ${unlockStatus.error ? 'error' : 'success'}`}>
                                {unlockStatus.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Footer */}
            <EnhancedFooter 
                courseId={courseId}
                courseData={courseData}
            />

            {/* AI-Enhanced Instructor Popup */}
            {showInstructorPopup && (
                <OpenAIInstructorPopup 
                    courseId={courseId}
                    lessonId={lessonId}
                    user={user}
                    onClose={() => setShowInstructorPopup(false)}
                />
            )}
        </>
    );
}