// Enhanced Cloud Function - Dynamic System Instructions
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");

// Define secret for OpenAI API key
const openaiKey = defineSecret("OPENAI_KEY");

initializeApp();

// Enhanced chatWithAssistant with dynamic system instructions
exports.chatWithAssistant = onCall({ cors: true, secrets: [openaiKey] }, async (request) => {
    if (!request.auth) { 
        throw new HttpsError("unauthenticated", "Authentication required."); 
    }
    
    const { chatType, threadId, message, courseId, userId, lessonId } = request.data;
    
    if (!chatType || !message) { 
        throw new HttpsError("invalid-argument", "Chat type and message are required."); 
    }

    const apiKey = openaiKey.value();
    if (!apiKey) {
        throw new HttpsError("internal", "OpenAI API key not configured");
    }

    const openai = new OpenAI({ apiKey });
    const db = getDatabase();

    try {
        // 1. Load AI Settings from Firebase
        const aiSettingsRef = db.ref('aiSettings');
        const aiSettingsSnapshot = await aiSettingsRef.once('value');
        const aiSettings = aiSettingsSnapshot.val() || {};
        
        // 2. Load User Profile for Personalization
        const userRef = db.ref(`users/${userId}/profile`);
        const userSnapshot = await userRef.once('value');
        const userProfile = userSnapshot.val() || {};
        
        // 3. Get appropriate system instructions
        let systemInstructions = '';
        const instructionTemplate = chatType === 'recitation' 
            ? aiSettings.systemInstructions?.coachAssistant?.instructions 
            : aiSettings.systemInstructions?.qnaAssistant?.instructions;
            
        if (!instructionTemplate) {
            // Fallback to default instructions
            systemInstructions = chatType === 'recitation' 
                ? `You are an encouraging AI Coach helping with lesson recitation. When the user completes successfully, provide unlock code: LESSON_UNLOCKED_${lessonId}`
                : `You are a helpful AI Concierge answering questions about course content.`;
        } else {
            // 4. Personalize instructions with user data
            systemInstructions = instructionTemplate
                .replace(/{firstName}/g, userProfile.firstName || 'Student')
                .replace(/{lastName}/g, userProfile.lastName || '')
                .replace(/{experienceLevel}/g, userProfile.experienceLevel || 'beginner')
                .replace(/{industry}/g, userProfile.industry || 'general')
                .replace(/{currentRole}/g, userProfile.currentRole || 'learner')
                .replace(/{lessonId}/g, lessonId || 'current_lesson')
                .replace(/{courseId}/g, courseId || 'current_course');
        }

        console.log('[DEBUG] Using personalized system instructions for:', userProfile.firstName);
        console.log('[DEBUG] Chat type:', chatType);

        // 5. Handle thread creation/retrieval
        let currentThreadId = threadId;
        
        if (!currentThreadId) {
            const thread = await openai.beta.threads.create({
                metadata: {
                    userId: userId,
                    studentName: userProfile.firstName || 'Student',
                    courseId: courseId || 'unknown',
                    lessonId: lessonId || 'unknown',
                    chatType: chatType
                }
            });
            currentThreadId = thread.id;
            
            // Save thread ID to Firebase
            const threadPath = lessonId 
                ? `users/${userId}/enrollments/${courseId}/progress/lessonThreads/${lessonId}`
                : `messagingThreads/${courseId}/${userId}`;
            await db.ref(threadPath).update({ assistantThreadId: currentThreadId });
        }

        // 6. Add user message to thread
        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: message
        });

        // 7. Create run with personalized system instructions (NO ASSISTANT ID)
        const runConfig = {
            model: aiSettings.globalSettings?.model || "gpt-4",
            instructions: systemInstructions,
            max_tokens: aiSettings.globalSettings?.maxTokens || 1000,
            temperature: aiSettings.globalSettings?.temperature || 0.7
        };

        console.log('[DEBUG] Creating run with config:', runConfig);
        
        const run = await openai.beta.threads.runs.create(currentThreadId, runConfig);

        // 8. Wait for completion
        let runStatus;
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds max wait time
        
        do {
            await new Promise(resolve => setTimeout(resolve, 2000));
            runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
            console.log('[DEBUG] Run status:', runStatus.status);
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new Error('Run timeout - exceeded maximum wait time');
            }
        } while (runStatus.status === "running" || runStatus.status === "in_progress" || runStatus.status === "queued");

        if (runStatus.status !== "completed") {
            logger.error("AI Run failed:", runStatus);
            throw new HttpsError("internal", `AI run failed with status: ${runStatus.status}`);
        }

        // 9. Get response
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const assistantResponse = messages.data.find(m => m.run_id === run.id && m.role === 'assistant');

        if (assistantResponse?.content[0]?.type === 'text') {
            const responseText = assistantResponse.content[0].text.value;
            
            // 10. Handle unlock codes for recitation
            let unlockCode = null;
            if (chatType === 'recitation' && responseText.includes('LESSON_UNLOCKED_')) {
                const unlockMatch = responseText.match(/LESSON_UNLOCKED_(\w+)/);
                if (unlockMatch) {
                    unlockCode = unlockMatch[0];
                    
                    // Update user progress
                    const progressRef = db.ref(`users/${userId}/enrollments/${courseId}/progress/lessons/${lessonId}`);
                    await progressRef.update({
                        unlocked: true,
                        unlockedAt: new Date().toISOString(),
                        unlockCode: unlockCode
                    });
                }
            }
            
            return { 
                success: true, 
                response: responseText, 
                threadId: currentThreadId,
                unlockCode: unlockCode
            };
        } else {
            throw new HttpsError("internal", "Unexpected response format from AI");
        }

    } catch (error) {
        logger.error("Error in chatWithAssistant:", error);
        throw new HttpsError("internal", error.message || "AI communication failed");
    }
});

// New function to update AI settings
exports.updateAiSettings = onCall({ cors: true }, async (request) => {
    if (!request.auth) { 
        throw new HttpsError("unauthenticated", "Authentication required."); 
    }
    
    // TODO: Add admin role verification here
    const { systemInstructions, globalSettings } = request.data;
    
    try {
        const db = getDatabase();
        const settingsRef = db.ref('aiSettings');
        
        await settingsRef.set({
            systemInstructions: systemInstructions,
            globalSettings: globalSettings,
            lastUpdated: new Date().toISOString(),
            updatedBy: request.auth.uid
        });
        
        return { success: true, message: "AI settings updated successfully" };
    } catch (error) {
        logger.error("Error updating AI settings:", error);
        throw new HttpsError("internal", "Failed to update AI settings");
    }
});
