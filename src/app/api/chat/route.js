import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { database } from '../../lib/firebase';
import { ref, get } from 'firebase/database';

// Validate API key
if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
    try {
        const { message, threadId, assistantId, lessonId, courseId, userId, chatType } = await request.json();
        

        
        // Validate required parameters
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        
        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }

        // 🔥 NEW: GET USER CONTEXT FROM FIREBASE
        let userContext = null;
        if (userId) {
            try {
                const userRef = ref(database, `users/${userId}/profile`);
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                    userContext = userSnapshot.val();
                }
            } catch (error) {
                console.error('Error loading user context:', error);
                // Continue without user context
            }
        }
        
        let currentThreadId = threadId;
        
        // Create thread if not provided
        if (!currentThreadId) {

            const thread = await openai.beta.threads.create({
                // Add user metadata to thread
                metadata: {
                    userId: userId || 'unknown',
                    studentName: userContext?.firstName || 'Student',
                    courseId: courseId || 'unknown',
                    lessonId: lessonId || 'unknown',
                    chatType: chatType || 'general'
                }
            });
            currentThreadId = thread.id;

        }

        // 🔥 NEW: CREATE ENHANCED MESSAGE WITH USER CONTEXT
        let enhancedMessage = message;
        let runInstructions = '';

        if (userContext) {
            // Prepend user context to the message
            const userContextString = `[Student: ${userContext.firstName} ${userContext.lastName || ''}, Role: ${userContext.currentRole || 'Student'}, Level: ${userContext.experienceLevel || 'beginner'}, Industry: ${userContext.industry || 'General'}]`;
            
            enhancedMessage = `${userContextString}\n\nStudent Message: ${message}`;

            // Create personalized instructions for the assistant
            runInstructions = `You are tutoring ${userContext.firstName}. Always address them by their first name "${userContext.firstName}" naturally in your responses. Their experience level is ${userContext.experienceLevel || 'beginner'} and they work in ${userContext.industry || 'general'} field. Tailor your explanations to their level and use relevant examples from their industry when appropriate.`;
            

        }
        
        // Add message to thread

        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: enhancedMessage  // Using enhanced message with user context
        });
        
        // Create run with personalized instructions

        const runConfig = {
            assistant_id: assistantId
        };

        // Add personalized instructions if we have user context
        if (runInstructions) {
            runConfig.instructions = runInstructions;
        }

        const run = await openai.beta.threads.runs.create(currentThreadId, runConfig);
        

        
        // Wait for completion - WORKAROUND for runs.retrieve() parameter bug
        let runStatus = run;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (runStatus.status === "running" || runStatus.status === "in_progress" || runStatus.status === "queued") {
            if (attempts >= maxAttempts) {
                throw new Error('Run timeout after 30 seconds');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            console.log('[DEBUG] Checking run status, attempt:', attempts + 1);
            
            // WORKAROUND: Use runs.list() instead of runs.retrieve() to avoid parameter bug
            try {
                const runsList = await openai.beta.threads.runs.list(currentThreadId, { limit: 1 });
                const latestRun = runsList.data.find(r => r.id === run.id);
                
                if (latestRun) {
                    runStatus = latestRun;
                    console.log('[DEBUG] Run status via list():', runStatus.status);
                } else {
                    // Fallback: try the problematic retrieve method
                    console.log('[DEBUG] Attempting problematic retrieve method...');
                    runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
                    console.log('[DEBUG] Run status via retrieve():', runStatus.status);
                }
            } catch (retrieveError) {
                console.log('[DEBUG] Retrieve failed, using list() workaround:', retrieveError.message);
                const runsList = await openai.beta.threads.runs.list(currentThreadId, { limit: 5 });
                const latestRun = runsList.data.find(r => r.id === run.id);
                
                if (latestRun) {
                    runStatus = latestRun;
                    console.log('[DEBUG] Run status via list() fallback:', runStatus.status);
                } else {
                    throw new Error('Cannot retrieve run status');
                }
            }
            
            attempts++;
        }
        
        if (runStatus.status !== "completed") {
            console.error('[ERROR] Run failed with status:', runStatus.status);
            return NextResponse.json({ 
                error: `AI run failed with status: ${runStatus.status}` 
            }, { status: 500 });
        }
        
        // Get messages
        console.log('[DEBUG] Retrieving messages from thread');
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        
        // Find the assistant's latest response
        const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
        
        if (assistantMessages.length === 0) {
            return NextResponse.json({ 
                error: 'No response from assistant' 
            }, { status: 500 });
        }
        
        const latestResponse = assistantMessages[0];
        const responseText = latestResponse.content[0]?.text?.value || 'No response content';
        
        console.log('[DEBUG] Successfully got response, length:', responseText.length);
        
        // Handle special cases based on chat type
        let unlockCode = null;
        if (chatType === "recitation") {
            // Check if the response contains an unlock code pattern
            const codeMatch = responseText.match(/(?:unlock|code|access).*?([A-Z0-9]{6,})/i);
            if (codeMatch) {
                unlockCode = codeMatch[1];
                console.log('[DEBUG] Extracted unlock code:', unlockCode);
            }
        } else if (chatType === "qna") {
            // Send email notification for QnA queries (placeholder for now)
            console.log('[DEBUG] QnA query received - notification should be sent');
            // TODO: Implement email notification service
        }
        
        // Return success response
        return NextResponse.json({
            success: true,
            response: responseText,
            threadId: currentThreadId,
            runId: run.id,
            unlockCode: unlockCode,
            chatType: chatType
        });
        
    } catch (error) {
        console.error('[ERROR] API Route error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal server error',
            details: error.stack
        }, { status: 500 });
    }
}
