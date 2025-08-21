// --- Simplified AI Personalization for OpenAI Integration ---
'use client';
import { ref, set, get, update } from 'firebase/database';
import { database } from './firebase';
import { migrateUserProfile, updateUserProfile } from '../shared/schemas/user-profile';

/**
 * Lightweight AI Personalization Engine
 * Focuses on user data collection and basic personalization
 * Designed to complement OpenAI Assistant without conflicts
 */

class SimplifiedAIPersonalization {
    constructor() {
        this.userProfiles = new Map();
    }

    /**
     * Core User Profile Management
     * Collects and maintains user data for OpenAI Assistant to use
     */
    async enrichUserProfile(userId, basicData = {}) {
        try {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);
            const existingData = snapshot.val() || {};

            // Migrate existing profile to unified schema
            const migratedProfile = migrateUserProfile(existingData);
            
            // Update with new data using unified schema
            const profileUpdates = {
                firstName: basicData.firstName || migratedProfile.profile.firstName,
                lastName: basicData.lastName || migratedProfile.profile.lastName,
                email: basicData.email || migratedProfile.profile.email,
                lastActive: new Date().toISOString()
            };

            const updatedProfile = updateUserProfile(migratedProfile, profileUpdates);
            
            // Update AI context if new session
            if (basicData.newSession) {
                updatedProfile.aiContext = {
                    ...updatedProfile.aiContext,
                    totalSessions: (updatedProfile.aiContext.totalSessions || 0) + 1,
                    lastSessionDate: new Date().toISOString(),
                    preferences: {
                        timezone: this.detectTimezone(),
                        ...updatedProfile.aiContext.preferences
                    }
                };
            }

            await set(userRef, updatedProfile);
            this.userProfiles.set(userId, updatedProfile);

            return updatedProfile;
        } catch (error) {
            console.error('Error enriching user profile:', error);
            throw error;
        }
    }

    /**
     * Get user context for OpenAI Assistant
     * Returns formatted user data that OpenAI can use in responses
     */
    async getUserContextForAI(userId) {
        try {
            const profile = await this.getUserProfile(userId);
            
            if (!profile) return null;

            // Format user context for OpenAI Assistant
            return {
                // Basic personalization variables
                firstName: profile.personal?.firstName || '',
                lastName: profile.personal?.lastName || '',
                fullName: `${profile.personal?.firstName || ''} ${profile.personal?.lastName || ''}`.trim(),
                preferredName: profile.personal?.preferredName || profile.personal?.firstName || '',
                email: profile.personal?.email || '',
                
                // Career context for relevant responses
                currentRole: profile.career?.currentRole || '',
                industry: profile.career?.industryInterest || '',
                experienceLevel: profile.career?.experienceLevel || 'beginner',
                primaryGoals: profile.career?.primaryGoals || [],
                
                // Learning context
                skillLevel: profile.learning?.skillLevel || 'beginner',
                timeCommitment: profile.learning?.timeCommitment || '',
                motivations: profile.learning?.motivations || [],
                
                // Engagement data
                isNewUser: (profile.engagement?.totalSessions || 0) < 3,
                totalSessions: profile.engagement?.totalSessions || 0,
                coursesEnrolled: profile.engagement?.coursesEnrolled || [],
                
                // Utility data
                timezone: profile.personal?.timezone || 'UTC',
                timeOfDay: this.getTimeOfDay(),
                daysSinceJoined: this.calculateDaysSince(profile.profile?.createdAt)
            };
        } catch (error) {
            console.error('Error getting user context for AI:', error);
            return null;
        }
    }

    /**
     * Simple name replacement for instructor messages
     * Basic personalization without conflicting with OpenAI
     */
    personalizeInstructorMessage(template, userContext) {
        if (!template || !userContext) return template;

        const name = userContext.preferredName || userContext.firstName || 'Student';
        
        // Simple variable replacement
        return template
            .replace(/\{firstName\}/g, userContext.firstName || 'Student')
            .replace(/\{lastName\}/g, userContext.lastName || '')
            .replace(/\{fullName\}/g, userContext.fullName || name)
            .replace(/\{preferredName\}/g, name)
            .replace(/\{email\}/g, userContext.email || '')
            .replace(/\{currentRole\}/g, userContext.currentRole || '');
    }

    /**
     * Track simple engagement for progress
     */
    async trackEngagement(userId, activityData) {
        try {
            const userRef = ref(database, `users/${userId}/engagement`);
            const snapshot = await get(userRef);
            const currentEngagement = snapshot.val() || {};

            const updatedEngagement = {
                ...currentEngagement,
                totalSessions: (currentEngagement.totalSessions || 0) + 1,
                lastSessionDate: new Date().toISOString(),
                lastActivity: activityData.type || 'general',
                completedLessons: activityData.lessonCompleted 
                    ? [...(currentEngagement.completedLessons || []), activityData.lessonId]
                    : currentEngagement.completedLessons || []
            };

            await update(userRef, updatedEngagement);
            
        } catch (error) {
            console.error('Error tracking engagement:', error);
        }
    }

    /**
     * Utility Methods
     */
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

    isProfileComplete(profile) {
        return !!(
            profile.personal?.firstName &&
            profile.personal?.email &&
            profile.career?.currentRole &&
            profile.learning?.skillLevel
        );
    }

    detectTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    calculateDaysSince(dateString) {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const now = new Date();
        return Math.floor((now - date) / (1000 * 60 * 60 * 24));
    }
}

// Export simplified instance
export const simplifiedAI = new SimplifiedAIPersonalization();

// Helper function for OpenAI Assistant integration
export const getAIContext = async (userId) => {
    return await simplifiedAI.getUserContextForAI(userId);
};

// Helper function for instructor message personalization
export const personalizeMessage = (template, userId) => {
    return simplifiedAI.personalizeInstructorMessage(template, userId);
};

export default SimplifiedAIPersonalization;
