// --- AI-Enhanced User Personalization System ---
'use client';
import { ref, set, get, update } from 'firebase/database';
import { database } from './firebase';

/**
 * AI-Enhanced User Data Population and Personalization Engine
 * Intelligently collects, enriches, and utilizes user data for personalized experiences
 */

class AIPersonalizationEngine {
    constructor() {
        this.userProfiles = new Map();
        this.learningPatterns = new Map();
        this.engagementMetrics = new Map();
    }

    /**
     * Phase 1: Intelligent Data Collection
     * Automatically enriches user profiles with behavioral data
     */
    async enrichUserProfile(userId, basicData = {}) {
        try {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);
            const existingData = snapshot.val() || {};

            // AI-enhanced profile building
            const enrichedProfile = {
                ...existingData,
                ...basicData,
                
                // Basic Demographics (from registration/social login)
                demographics: {
                    firstName: basicData.firstName || existingData.firstName || '',
                    lastName: basicData.lastName || existingData.lastName || '',
                    email: basicData.email || existingData.email || '',
                    location: basicData.location || existingData.location || '',
                    timezone: this.detectTimezone(),
                    preferredLanguage: this.detectLanguage(),
                    ...existingData.demographics
                },

                // Learning Preferences (AI-detected)
                learningPreferences: {
                    visualLearner: 0.5, // Will be AI-calculated based on interaction patterns
                    auditoryLearner: 0.5,
                    kinestheticLearner: 0.5,
                    preferredPaceSpeed: 'medium', // slow, medium, fast
                    bestLearningTimes: [], // ['morning', 'afternoon', 'evening']
                    attentionSpan: 15, // minutes, AI-calculated
                    motivationTriggers: [], // ['achievements', 'progress', 'social', 'deadlines']
                    ...existingData.learningPreferences
                },

                // Behavioral Patterns (AI-tracked)
                behaviorMetrics: {
                    sessionDuration: [],
                    loginFrequency: 0,
                    completionRate: 0,
                    strugglingTopics: [],
                    strongTopics: [],
                    engagementScore: 0,
                    lastActive: new Date().toISOString(),
                    devicePreference: this.detectDevice(),
                    ...existingData.behaviorMetrics
                },

                // Career & Goals (user-input + AI-enhanced)
                careerProfile: {
                    currentRole: basicData.currentRole || '',
                    industryInterest: basicData.industryInterest || '',
                    careerGoals: basicData.careerGoals || [],
                    skillLevel: basicData.skillLevel || 'beginner',
                    experienceYears: basicData.experienceYears || 0,
                    targetSalary: basicData.targetSalary || '',
                    learningObjectives: [],
                    ...existingData.careerProfile
                },

                // AI Insights
                aiInsights: {
                    personalityType: null, // Will be determined through interactions
                    learningStyle: 'adaptive', // visual, auditory, kinesthetic, adaptive
                    riskOfDropout: 'low', // low, medium, high
                    recommendedPath: null,
                    nextBestAction: null,
                    confidenceMetrics: {},
                    lastAnalyzed: new Date().toISOString(),
                    ...existingData.aiInsights
                },

                // Social Learning Data
                socialProfile: {
                    collaborationPreference: 'mixed', // solo, group, mixed
                    helpSeekingBehavior: 'moderate', // low, moderate, high
                    mentorshipInterest: false,
                    peerConnectionScore: 0,
                    communicationStyle: 'balanced', // direct, supportive, detailed, balanced
                    ...existingData.socialProfile
                }
            };

            await set(userRef, enrichedProfile);
            this.userProfiles.set(userId, enrichedProfile);
            
            return enrichedProfile;
        } catch (error) {
            console.error('Error enriching user profile:', error);
            throw error;
        }
    }

    /**
     * Phase 2: Behavioral Analytics & Pattern Recognition
     */
    async trackLearningSession(userId, sessionData) {
        const {
            courseId,
            lessonId,
            startTime,
            endTime,
            completionPercentage,
            interactions,
            strugglingPoints,
            engagementEvents
        } = sessionData;

        try {
            const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60); // minutes
            
            // Update behavioral metrics
            const userRef = ref(database, `users/${userId}/behaviorMetrics`);
            const snapshot = await get(userRef);
            const currentMetrics = snapshot.val() || {};

            const updatedMetrics = {
                ...currentMetrics,
                sessionDuration: [...(currentMetrics.sessionDuration || []), duration].slice(-20), // Keep last 20 sessions
                totalSessionsCompleted: (currentMetrics.totalSessionsCompleted || 0) + 1,
                averageSessionTime: this.calculateAverageSessionTime(userId, duration),
                lastSessionCompletionRate: completionPercentage,
                strugglingTopics: this.updateStruggleList(currentMetrics.strugglingTopics || [], strugglingPoints),
                engagementScore: this.calculateEngagementScore(engagementEvents),
                lastActive: new Date().toISOString()
            };

            await update(userRef, updatedMetrics);
            
            // Trigger AI analysis for insights
            await this.analyzeUserBehavior(userId);
            
        } catch (error) {
            console.error('Error tracking learning session:', error);
        }
    }

    /**
     * Phase 3: AI-Powered Personalization
     */
    async generatePersonalizedContent(userId, contentType = 'general') {
        try {
            const userProfile = await this.getUserProfile(userId);
            
            switch (contentType) {
                case 'welcome_message':
                    return this.generateWelcomeMessage(userProfile);
                case 'motivation_message':
                    return this.generateMotivationMessage(userProfile);
                case 'lesson_introduction':
                    return this.generateLessonIntro(userProfile);
                case 'progress_feedback':
                    return this.generateProgressFeedback(userProfile);
                case 'learning_recommendations':
                    return this.generateRecommendations(userProfile);
                default:
                    return this.generateGeneralMessage(userProfile);
            }
        } catch (error) {
            console.error('Error generating personalized content:', error);
            return null;
        }
    }

    /**
     * Intelligent Welcome Message Generation
     */
    generateWelcomeMessage(userProfile) {
        const { firstName, learningPreferences, careerProfile, behaviorMetrics } = userProfile;
        const timeOfDay = this.getTimeOfDay();
        const returningUser = behaviorMetrics?.totalSessionsCompleted > 0;

        if (returningUser) {
            const lastSession = Math.floor((Date.now() - new Date(behaviorMetrics.lastActive)) / (1000 * 60 * 60 * 24));
            
            if (lastSession === 0) {
                return `Welcome back, ${firstName}! Ready to continue your learning journey?`;
            } else if (lastSession === 1) {
                return `Good to see you again, ${firstName}! Let's pick up where you left off yesterday.`;
            } else if (lastSession <= 7) {
                return `Welcome back, ${firstName}! You've been away for ${lastSession} days. Let's get back into learning mode!`;
            } else {
                return `Welcome back, ${firstName}! It's been a while. Let's refresh your memory and continue growing!`;
            }
        } else {
            // New user personalization
            const careerFocus = careerProfile?.currentRole ? ` as a ${careerProfile.currentRole}` : '';
            return `Good ${timeOfDay}, ${firstName}! Welcome to your personalized learning journey${careerFocus}. Let's start building your future!`;
        }
    }

    /**
     * Adaptive Motivation Message Generation
     */
    generateMotivationMessage(userProfile) {
        const { firstName, behaviorMetrics, careerProfile, learningPreferences } = userProfile;
        const completionRate = behaviorMetrics?.completionRate || 0;
        const engagementScore = behaviorMetrics?.engagementScore || 50;

        if (completionRate > 0.8) {
            return `Incredible progress, ${firstName}! You're in the top 20% of learners. Your dedication is paying off!`;
        } else if (completionRate > 0.6) {
            return `Great momentum, ${firstName}! You're doing well. Keep pushing forward to reach your ${careerProfile?.careerGoals?.[0] || 'goals'}!`;
        } else if (completionRate > 0.3) {
            return `Every step counts, ${firstName}. Remember, ${careerProfile?.careerGoals?.[0] || 'success'} is built one lesson at a time. You've got this!`;
        } else {
            return `${firstName}, let's restart strong! Small consistent steps lead to big achievements. Your future self will thank you.`;
        }
    }

    /**
     * Utility Methods
     */
    detectTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    detectLanguage() {
        return navigator.language || 'en-US';
    }

    detectDevice() {
        if (typeof window === 'undefined') return 'unknown';
        const userAgent = navigator.userAgent;
        if (/Mobi|Android/i.test(userAgent)) return 'mobile';
        if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
        return 'desktop';
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    calculateEngagementScore(events) {
        // AI algorithm to calculate engagement based on user interactions
        let score = 50; // baseline
        
        events?.forEach(event => {
            switch (event.type) {
                case 'note_taking': score += 10; break;
                case 'replay_content': score += 5; break;
                case 'bookmark': score += 8; break;
                case 'question_asked': score += 15; break;
                case 'long_pause': score -= 5; break;
                case 'tab_switch': score -= 3; break;
                case 'completion': score += 20; break;
            }
        });

        return Math.max(0, Math.min(100, score));
    }

    async getUserProfile(userId) {
        if (this.userProfiles.has(userId)) {
            return this.userProfiles.get(userId);
        }
        
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        const profile = snapshot.val();
        
        if (profile) {
            this.userProfiles.set(userId, profile);
        }
        
        return profile;
    }

    async analyzeUserBehavior(userId) {
        // Placeholder for advanced AI analysis
        // This would integrate with ML models to predict learning patterns
        console.log(`Analyzing behavior patterns for user ${userId}`);
    }
}

export const aiPersonalization = new AIPersonalizationEngine();
export default AIPersonalizationEngine;
