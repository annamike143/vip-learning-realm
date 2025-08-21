// --- OpenAI Assistant Data Bridge Solutions ---

/*
PROBLEM: OpenAI Assistant needs access to user data (firstName, etc.) but can't directly access Firebase

SOLUTIONS: We need to inject user data into the conversation context when calling OpenAI
*/

// ========================================
// SOLUTION 1: Dynamic System Message Injection
// ========================================

/**
 * When user starts a conversation, inject their data into the OpenAI call
 * This works by modifying the messages array sent to OpenAI
 */

import { getAIContext } from '../lib/simplifiedAI';

export const createOpenAIConversation = async (userId, userMessage, assistantId) => {
    // Get user context from our Firebase data
    const userContext = await getAIContext(userId);
    
    // Create dynamic system message with user data
    const systemMessage = `
You are a helpful AI assistant and conversational tutor. 

STUDENT INFORMATION:
- Student Name: ${userContext.firstName || 'Student'}
- Full Name: ${userContext.fullName || 'Student'}
- Role: ${userContext.currentRole || 'Learner'}
- Experience Level: ${userContext.experienceLevel || 'beginner'}
- Industry: ${userContext.industry || 'General'}
- Goals: ${userContext.primaryGoals?.join(', ') || 'Learning and growth'}

INSTRUCTIONS:
- Always address the student by their name: ${userContext.firstName || 'Student'}
- Tailor your responses to their experience level: ${userContext.experienceLevel || 'beginner'}
- Reference their industry when giving examples: ${userContext.industry || 'General'}
- Refer to the attached documents for your core response framework when assessing their learning

Remember: The student's name is ${userContext.firstName || 'Student'} - use it naturally in conversation.
    `;

    // Send to OpenAI with dynamic context
    const messages = [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
    ];

    return {
        assistantId,
        messages,
        userContext
    };
};

// ========================================
// SOLUTION 2: Pre-populate Assistant Instructions
// ========================================

/**
 * Update OpenAI Assistant instructions dynamically for each user session
 * This modifies the assistant's system instructions before conversation starts
 */

export const updateAssistantForUser = async (assistantId, userId) => {
    const userContext = await getAIContext(userId);
    
    const personalizedInstructions = `
You are a helpful AI assistant and conversational tutor for ${userContext.firstName || 'Student'}.

CURRENT STUDENT: ${userContext.fullName || 'Student'}
- Address them as: ${userContext.firstName || 'Student'}
- Their role: ${userContext.currentRole || 'Learner'}
- Experience level: ${userContext.experienceLevel || 'beginner'}
- Industry focus: ${userContext.industry || 'General'}
- Learning goals: ${userContext.primaryGoals?.join(', ') || 'General learning'}

Use this information to personalize your responses. Always use their name (${userContext.firstName}) when appropriate.
Refer to the attached documents for your core response framework when interacting with the student and assessing their learning for that lesson.
    `;

    // This would require OpenAI API call to modify assistant instructions
    // Note: This is a conceptual approach - OpenAI API limits may apply
    
    return personalizedInstructions;
};

// ========================================
// SOLUTION 3: Context Injection via Thread Messages
// ========================================

/**
 * Start each conversation thread with a hidden context message
 * This injects user data at the beginning of every conversation
 */

export const startPersonalizedThread = async (userId) => {
    const userContext = await getAIContext(userId);
    
    // Create initial context message (can be hidden from user)
    const contextMessage = `
[SYSTEM CONTEXT - STUDENT INFO]
Student: ${userContext.firstName} ${userContext.lastName}
Role: ${userContext.currentRole}
Level: ${userContext.experienceLevel}
Industry: ${userContext.industry}
Goals: ${userContext.primaryGoals?.join(', ')}

Please remember to address this student as ${userContext.firstName} throughout our conversation.
    `;

    return {
        initialMessage: contextMessage,
        userContext
    };
};

// ========================================
// SOLUTION 4: Real-time Data Injection (Recommended)
// ========================================

/**
 * Intercept every message to OpenAI and inject current user context
 * This ensures OpenAI always has fresh user data
 */

export class OpenAIPersonalizationBridge {
    constructor() {
        this.userSessions = new Map();
    }

    async initializeUserSession(userId, assistantId) {
        const userContext = await getAIContext(userId);
        
        this.userSessions.set(userId, {
            assistantId,
            userContext,
            threadId: null,
            lastUpdated: new Date()
        });

        return userContext;
    }

    async sendMessageWithContext(userId, userMessage) {
        const session = this.userSessions.get(userId);
        if (!session) {
            throw new Error('User session not initialized');
        }

        // Refresh user context if needed (every 5 minutes)
        if (Date.now() - session.lastUpdated > 5 * 60 * 1000) {
            session.userContext = await getAIContext(userId);
            session.lastUpdated = new Date();
        }

        // Create enhanced message with user context
        const enhancedMessage = this.enhanceMessageWithContext(userMessage, session.userContext);

        return {
            assistantId: session.assistantId,
            message: enhancedMessage,
            userContext: session.userContext
        };
    }

    enhanceMessageWithContext(message, userContext) {
        // Option A: Prepend context to user message
        const contextPrefix = `[Student: ${userContext.firstName} ${userContext.lastName}, Role: ${userContext.currentRole}, Level: ${userContext.experienceLevel}]\n\n`;
        
        return contextPrefix + message;

        // Option B: Use system message approach (cleaner)
        // This would be handled in the calling function
    }

    getSystemMessageForUser(userContext) {
        return `
You are a helpful AI assistant and conversational tutor.

CURRENT STUDENT CONTEXT:
- Name: ${userContext.firstName} ${userContext.lastName}
- Preferred Name: ${userContext.firstName}
- Current Role: ${userContext.currentRole || 'Student'}
- Experience Level: ${userContext.experienceLevel || 'beginner'}
- Industry: ${userContext.industry || 'General'}
- Learning Goals: ${userContext.primaryGoals?.join(', ') || 'Skill development'}
- Session Type: ${userContext.isNewUser ? 'First time' : 'Returning student'}

PERSONALIZATION RULES:
- Always address them as "${userContext.firstName}"
- Adjust complexity to their ${userContext.experienceLevel} level
- Use ${userContext.industry} examples when relevant
- Reference their goals: ${userContext.primaryGoals?.join(', ') || 'learning objectives'}

Refer to the attached documents for your core response framework when interacting with ${userContext.firstName} and assessing their learning for that lesson.
        `;
    }
}

// ========================================
// IMPLEMENTATION EXAMPLE
// ========================================

// Usage in your ChatInterface component:
export const implementPersonalizedChat = async (userId, userMessage, assistantId) => {
    const bridge = new OpenAIPersonalizationBridge();
    
    // Initialize user session
    const userContext = await bridge.initializeUserSession(userId, assistantId);
    
    // Prepare message with context
    const { message, userContext: currentContext } = await bridge.sendMessageWithContext(userId, userMessage);
    
    // Create OpenAI API call
    const openAIRequest = {
        assistant_id: assistantId,
        thread: {
            messages: [
                {
                    role: "system",
                    content: bridge.getSystemMessageForUser(currentContext)
                },
                {
                    role: "user", 
                    content: message
                }
            ]
        }
    };

    // Now OpenAI has all the user context!
    return openAIRequest;
};

console.log("🔗 OpenAI Data Bridge Solutions Ready!");
console.log("Choose the approach that works best with your OpenAI setup!");

export default {
    createOpenAIConversation,
    updateAssistantForUser,
    startPersonalizedThread,
    OpenAIPersonalizationBridge,
    implementPersonalizedChat
};
