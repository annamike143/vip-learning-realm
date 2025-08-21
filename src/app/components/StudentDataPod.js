// --- src/app/components/StudentDataPod.js ---
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from './ThemeProvider';
import { calculateCourseProgress, getAllLessonsInOrder } from '../utils/progressUtils';
import './StudentDataPod.css';

const StudentDataPod = ({ courseId, currentLessonId }) => {
    const { user } = useAuth();
    const { currentTheme } = useTheme();
    const [userProgress, setUserProgress] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!user || !courseId) return;

        const progressRef = ref(database, `userProgress/${user.uid}`);
        const courseRef = ref(database, `courses/${courseId}`);
        const profileRef = ref(database, `users/${user.uid}/profile`);

        const unsubProgress = onValue(progressRef, (snapshot) => {
            setUserProgress(snapshot.val() || {});
        });

        const unsubCourse = onValue(courseRef, (snapshot) => {
            setCourseData(snapshot.val() || {});
            setLoading(false);
        });

        const unsubProfile = onValue(profileRef, (snapshot) => {
            setUserProfile(snapshot.val() || {});
        });

        return () => {
            unsubProgress();
            unsubCourse();
            unsubProfile();
        };
    }, [user, courseId]);

    // Helper functions - moved above useMemo to fix initialization error
    const calculateStreak = (dates) => {
        if (dates.length === 0) return 0;
        
        const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
        let streak = 1;
        let currentDate = new Date(sortedDates[0]);
        
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i]);
            const diffTime = currentDate - prevDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }
        
        return streak;
    };

    const calculateAchievements = (completed, total, streak) => {
        const achievements = [];
        
        if (completed >= 1) {
            achievements.push({ 
                id: 'first-lesson', 
                name: 'First Step', 
                icon: '🎯', 
                description: 'Completed your first lesson!' 
            });
        }
        
        if (completed >= Math.floor(total * 0.25)) {
            achievements.push({ 
                id: 'quarter', 
                name: 'Getting Started', 
                icon: '🌟', 
                description: '25% progress achieved!' 
            });
        }
        
        if (completed >= Math.floor(total * 0.5)) {
            achievements.push({ 
                id: 'halfway', 
                name: 'Halfway Hero', 
                icon: '🏆', 
                description: 'Halfway through the course!' 
            });
        }
        
        if (completed >= Math.floor(total * 0.75)) {
            achievements.push({ 
                id: 'almost-there', 
                name: 'Almost There', 
                icon: '🚀', 
                description: '75% complete - you\'re crushing it!' 
            });
        }
        
        if (completed >= total) {
            achievements.push({ 
                id: 'graduate', 
                name: 'Course Graduate', 
                icon: '🎓', 
                description: 'Course completed! Amazing work!' 
            });
        }
        
        if (streak >= 3) {
            achievements.push({ 
                id: 'streak-3', 
                name: 'On Fire', 
                icon: '🔥', 
                description: '3-day learning streak!' 
            });
        }
        
        if (streak >= 7) {
            achievements.push({ 
                id: 'streak-7', 
                name: 'Week Warrior', 
                icon: '⚡', 
                description: '7-day learning streak!' 
            });
        }
        
        return achievements;
    };

    const getNextMilestone = (progress) => {
        if (progress < 25) return { target: 25, label: '25% Complete' };
        if (progress < 50) return { target: 50, label: 'Halfway Point' };
        if (progress < 75) return { target: 75, label: '75% Complete' };
        if (progress < 100) return { target: 100, label: 'Course Complete' };
        return null;
    };

    const stats = useMemo(() => {
        if (!courseData || !userProgress) return null;

        const allLessons = getAllLessonsInOrder(courseData);
        const { completedCount, totalCount, progressPercentage } = calculateCourseProgress(userProgress, courseData);
        
        const completedLessons = userProgress.completedLessons || {};
        const unlockedLessons = userProgress.unlockedLessons || {};
        
        // Calculate learning streak
        const completedDates = Object.keys(completedLessons).map(lessonId => 
            completedLessons[lessonId]?.completedAt || completedLessons[lessonId]
        ).filter(Boolean);
        
        const uniqueDates = [...new Set(completedDates.map(date => 
            new Date(date).toDateString()
        ))];
        
        const learningStreak = calculateStreak(uniqueDates);
        
        // Achievement badges
        const achievements = calculateAchievements(completedCount, totalCount, learningStreak);
        
        return {
            completedCount,
            totalCount,
            progressPercentage,
            unlockedCount: Object.keys(unlockedLessons).length,
            learningStreak,
            achievements,
            nextMilestone: getNextMilestone(progressPercentage)
        };
    }, [courseData, userProgress]);

    if (loading || !stats) {
        return (
            <div className="student-data-pod loading">
                <div className="pod-skeleton">
                    <div className="skeleton-circle"></div>
                    <div className="skeleton-lines">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`student-data-pod ${isExpanded ? 'expanded' : ''}`}>
            <div className="pod-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="student-avatar">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                
                <div className="student-info">
                    <h4 className="student-name">
                        {userProfile?.name || user?.email?.split('@')[0] || 'Student'}
                    </h4>
                    <div className="quick-stats">
                        <span className="progress-text">
                            {stats.completedCount}/{stats.totalCount} lessons
                        </span>
                        <span className="streak-text">
                            🔥 {stats.learningStreak} day streak
                        </span>
                    </div>
                </div>
                
                <div className="expand-indicator">
                    {isExpanded ? '▼' : '▶'}
                </div>
            </div>

            {isExpanded && (
                <div className="pod-content">
                    {/* Progress Section */}
                    <div className="progress-section">
                        <div className="progress-header">
                            <h5>Course Progress</h5>
                            <span className="progress-percentage">{Math.round(stats.progressPercentage)}%</span>
                        </div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar"
                                style={{ 
                                    background: `linear-gradient(90deg, ${currentTheme.primary} 0%, ${currentTheme.primaryLight} 100%)` 
                                }}
                            >
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${stats.progressPercentage}%` }}
                                />
                            </div>
                        </div>
                        
                        {stats.nextMilestone && (
                            <div className="next-milestone">
                                🎯 Next: {stats.nextMilestone.label}
                            </div>
                        )}
                    </div>

                    {/* Achievements Section */}
                    <div className="achievements-section">
                        <h5>Achievements ({stats.achievements.length})</h5>
                        <div className="achievements-grid">
                            {stats.achievements.map(achievement => (
                                <div key={achievement.id} className="achievement-badge">
                                    <div className="achievement-icon">{achievement.icon}</div>
                                    <div className="achievement-info">
                                        <span className="achievement-name">{achievement.name}</span>
                                        <span className="achievement-desc">{achievement.description}</span>
                                    </div>
                                </div>
                            ))}
                            
                            {stats.achievements.length === 0 && (
                                <div className="no-achievements">
                                    <p>🌟 Complete lessons to earn achievements!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-value">{stats.completedCount}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.unlockedCount}</span>
                            <span className="stat-label">Unlocked</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.learningStreak}</span>
                            <span className="stat-label">Day Streak</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.totalCount - stats.completedCount}</span>
                            <span className="stat-label">Remaining</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDataPod;
