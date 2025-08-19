import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Debug: Check API key
console.log('[DEBUG] API Key loaded:', process.env.OPENAI_API_KEY ? 'Key exists' : 'Key missing');
console.log('[DEBUG] API Key length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('[DEBUG] API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20) || 'N/A');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
    try {
        const { message, threadId, assistantId, lessonId, courseId, userId, chatType } = await request.json();
        
        console.log('[DEBUG] API Route - Received:', { threadId, assistantId, lessonId, courseId, userId, chatType });
        
        // Validate required parameters
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        
        if (!assistantId) {
            return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
        }
        
        let currentThreadId = threadId;
        
        // Create thread if not provided
        if (!currentThreadId) {
            console.log('[DEBUG] Creating new thread');
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
            console.log('[DEBUG] Created thread:', currentThreadId);
        }
        
        // Add message to thread
        console.log('[DEBUG] Adding message to thread:', currentThreadId);
        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: message
        });
        
        // Create run
        console.log('[DEBUG] Creating run with assistant:', assistantId);
        const run = await openai.beta.threads.runs.create(currentThreadId, {
            assistant_id: assistantId
        });
        
        console.log('[DEBUG] Created run:', run.id);
        
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
