// --- AI-Powered Smart User Dashboard ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { aiPersonalization } from '../lib/aiPersonalization';
import './SmartDashboard.css';

export default function SmartDashboard({ user, courseId }) {
    const [userProfile, setUserProfile] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [learningStats, setLearningStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [motivationalMessage, setMotivationalMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadUserDashboard();
        }
    }, [user, courseId]);

    const loadUserDashboard = async () => {
        try {
            setLoading(true);

            // Load user profile
            const profile = await aiPersonalization.getUserProfile(user.uid);
            setUserProfile(profile);

            // Generate AI insights
            const insights = await generateDashboardInsights(profile);
            setAiInsights(insights);

            // Load learning statistics
            const stats = await loadLearningStats(user.uid);
            setLearningStats(stats);

            // Generate personalized recommendations
            const recs = await generateRecommendations(profile, stats);
            setRecommendations(recs);

            // Get motivational message
            const motivation = await aiPersonalization.generatePersonalizedContent(
                user.uid,
                'motivation_message'
            );
            setMotivationalMessage(motivation);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateDashboardInsights = async (profile) => {
        const insights = {
            learningPersonality: determineLearningPersonality(profile),
            strongAreas: identifyStrongAreas(profile),
            improvementAreas: identifyImprovementAreas(profile),
            optimalLearningTime: determineOptimalTime(profile),
            nextMilestone: calculateNextMilestone(profile),
            riskAssessment: assessDropoutRisk(profile)
        };

        return insights;
    };

    const determineLearningPersonality = (profile) => {
        const behavior = profile?.behaviorMetrics || {};
        const preferences = profile?.learningPreferences || {};
        
        const sessionDuration = behavior.sessionDuration || [];
        const avgSession = sessionDuration.reduce((a, b) => a + b, 0) / sessionDuration.length || 15;
        
        if (avgSession > 60) {
            return { type: 'Marathon Learner', icon: '🏃‍♂️', description: 'You prefer long, deep learning sessions' };
        } else if (avgSession < 20) {
            return { type: 'Sprint Learner', icon: '⚡', description: 'You excel with short, focused bursts' };
        } else {
            return { type: 'Balanced Learner', icon: '⚖️', description: 'You adapt well to various session lengths' };
        }
    };

    const identifyStrongAreas = (profile) => {
        const topics = profile?.behaviorMetrics?.strongTopics || [];
        return topics.slice(0, 3).map(topic => ({
            name: topic,
            icon: '💪',
            confidence: Math.floor(Math.random() * 20) + 80 // Simulated confidence score
        }));
    };

    const identifyImprovementAreas = (profile) => {
        const topics = profile?.behaviorMetrics?.strugglingTopics || [];
        return topics.slice(0, 3).map(topic => ({
            name: topic,
            icon: '🎯',
            suggestion: 'Consider reviewing fundamentals and practicing more'
        }));
    };

    const determineOptimalTime = (profile) => {
        const schedule = profile?.learningPreferences?.bestLearningTimes || [];
        if (schedule.length === 0) return 'Not yet determined';
        
        const timeMap = {
            'Early morning (6-9 AM)': { time: 'Early Morning', icon: '🌅' },
            'Mid-morning (9-12 PM)': { time: 'Mid Morning', icon: '☀️' },
            'Afternoon (12-5 PM)': { time: 'Afternoon', icon: '🌞' },
            'Evening (5-8 PM)': { time: 'Evening', icon: '🌆' },
            'Night (8-11 PM)': { time: 'Night', icon: '🌙' },
            'Late night (11+ PM)': { time: 'Late Night', icon: '🌃' }
        };
        
        return timeMap[schedule[0]] || { time: 'Flexible', icon: '⏰' };
    };

    const calculateNextMilestone = (profile) => {
        const completionRate = profile?.behaviorMetrics?.completionRate || 0;
        
        if (completionRate < 0.25) {
            return { milestone: 'Complete 25% of Course', progress: completionRate * 100, target: 25 };
        } else if (completionRate < 0.5) {
            return { milestone: 'Reach Halfway Point', progress: completionRate * 100, target: 50 };
        } else if (completionRate < 0.75) {
            return { milestone: 'Enter Final Quarter', progress: completionRate * 100, target: 75 };
        } else {
            return { milestone: 'Course Completion', progress: completionRate * 100, target: 100 };
        }
    };

    const assessDropoutRisk = (profile) => {
        const behavior = profile?.behaviorMetrics || {};
        const lastActive = behavior.lastActive ? new Date(behavior.lastActive) : new Date();
        const daysSinceActive = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24));
        
        if (daysSinceActive > 7) {
            return { risk: 'High', color: '#ef4444', message: 'Been away for a while - let\'s get back on track!' };
        } else if (daysSinceActive > 3) {
            return { risk: 'Medium', color: '#f59e0b', message: 'Great to see you back! Consistency is key.' };
        } else {
            return { risk: 'Low', color: '#10b981', message: 'Excellent engagement! Keep up the momentum.' };
        }
    };

    const loadLearningStats = async (userId) => {
        // Simulate loading learning statistics
        return {
            totalHours: Math.floor(Math.random() * 50) + 10,
            lessonsCompleted: Math.floor(Math.random() * 30) + 5,
            averageScore: Math.floor(Math.random() * 30) + 70,
            streakDays: Math.floor(Math.random() * 15) + 1,
            badgesEarned: Math.floor(Math.random() * 8) + 2
        };
    };

    const generateRecommendations = async (profile, stats) => {
        const recs = [];
        
        // Time-based recommendations
        const optimalTime = determineOptimalTime(profile);
        if (optimalTime.time !== 'Flexible') {
            recs.push({
                type: 'timing',
                icon: '⏰',
                title: 'Optimize Your Schedule',
                description: `Your best learning time is ${optimalTime.time}. Try scheduling sessions then for maximum retention.`
            });
        }

        // Completion-based recommendations
        const completionRate = profile?.behaviorMetrics?.completionRate || 0;
        if (completionRate < 0.3) {
            recs.push({
                type: 'motivation',
                icon: '🎯',
                title: 'Build Momentum',
                description: 'Set a goal to complete one lesson every 2 days. Small consistent steps lead to big wins!'
            });
        }

        // Skill-based recommendations
        const strugglingTopics = profile?.behaviorMetrics?.strugglingTopics || [];
        if (strugglingTopics.length > 0) {
            recs.push({
                type: 'improvement',
                icon: '📚',
                title: 'Focus Areas',
                description: `Consider reviewing ${strugglingTopics[0]} - additional practice can boost your confidence.`
            });
        }

        // Social recommendations
        if (stats?.lessonsCompleted > 10) {
            recs.push({
                type: 'social',
                icon: '👥',
                title: 'Share Your Progress',
                description: 'You\'re doing great! Consider connecting with other learners or mentoring newcomers.'
            });
        }

        return recs.slice(0, 4); // Limit to 4 recommendations
    };

    if (loading) {
        return (
            <div className="smart-dashboard loading">
                <div className="loading-spinner"></div>
                <p>Loading your personalized dashboard...</p>
            </div>
        );
    }

    return (
        <div className="smart-dashboard">
            {/* Header with Motivational Message */}
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h2>Welcome back, {userProfile?.demographics?.firstName || 'Learner'}! 👋</h2>
                    <p className="motivational-message">{motivationalMessage}</p>
                </div>
                <div className="ai-status">
                    <span className="ai-indicator">🤖 AI-Powered Insights</span>
                </div>
            </div>

            {/* Learning Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content">
                        <span className="stat-number">{learningStats?.totalHours}h</span>
                        <span className="stat-label">Total Hours</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <span className="stat-number">{learningStats?.lessonsCompleted}</span>
                        <span className="stat-label">Lessons Done</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                        <span className="stat-number">{learningStats?.averageScore}%</span>
                        <span className="stat-label">Avg Score</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-content">
                        <span className="stat-number">{learningStats?.streakDays}</span>
                        <span className="stat-label">Day Streak</span>
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="insights-section">
                <h3>🧠 Your Learning Profile</h3>
                <div className="insights-grid">
                    <div className="insight-card">
                        <div className="insight-header">
                            <span className="insight-icon">{aiInsights?.learningPersonality?.icon}</span>
                            <h4>{aiInsights?.learningPersonality?.type}</h4>
                        </div>
                        <p>{aiInsights?.learningPersonality?.description}</p>
                    </div>
                    
                    <div className="insight-card">
                        <div className="insight-header">
                            <span className="insight-icon">{aiInsights?.optimalLearningTime?.icon}</span>
                            <h4>Best Learning Time</h4>
                        </div>
                        <p>{aiInsights?.optimalLearningTime?.time}</p>
                    </div>
                    
                    <div className="insight-card">
                        <div className="insight-header">
                            <span className="insight-icon">📊</span>
                            <h4>Engagement Level</h4>
                        </div>
                        <div className="risk-indicator" style={{ color: aiInsights?.riskAssessment?.color }}>
                            {aiInsights?.riskAssessment?.risk} Risk
                        </div>
                        <p>{aiInsights?.riskAssessment?.message}</p>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="progress-section">
                <h3>🎯 Next Milestone</h3>
                <div className="milestone-card">
                    <div className="milestone-header">
                        <h4>{aiInsights?.nextMilestone?.milestone}</h4>
                        <span className="progress-percentage">
                            {Math.round(aiInsights?.nextMilestone?.progress || 0)}%
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${aiInsights?.nextMilestone?.progress || 0}%` }}
                        ></div>
                    </div>
                    <p>Keep going! You're {Math.round((aiInsights?.nextMilestone?.target || 100) - (aiInsights?.nextMilestone?.progress || 0))}% away from your next milestone.</p>
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="recommendations-section">
                <h3>💡 Personalized Recommendations</h3>
                <div className="recommendations-grid">
                    {recommendations.map((rec, index) => (
                        <div key={index} className="recommendation-card">
                            <div className="rec-icon">{rec.icon}</div>
                            <div className="rec-content">
                                <h4>{rec.title}</h4>
                                <p>{rec.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strong & Improvement Areas */}
            <div className="areas-section">
                <div className="areas-grid">
                    <div className="area-card strong">
                        <h4>💪 Your Strengths</h4>
                        {aiInsights?.strongAreas?.map((area, index) => (
                            <div key={index} className="area-item">
                                <span>{area.icon}</span>
                                <span>{area.name}</span>
                                <span className="confidence">{area.confidence}%</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="area-card improvement">
                        <h4>🎯 Focus Areas</h4>
                        {aiInsights?.improvementAreas?.map((area, index) => (
                            <div key={index} className="area-item">
                                <span>{area.icon}</span>
                                <div>
                                    <div>{area.name}</div>
                                    <small>{area.suggestion}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
