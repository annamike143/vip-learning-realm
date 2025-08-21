// API Route: /api/openai-assistant
// This handles the server-side OpenAI integration with user context

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { assistantId, threadId, messages, userContext, metadata } = await request.json();

    console.log('🤖 OpenAI API Call with User Context:', {
      studentName: userContext.firstName,
      assistantId,
      hasThread: !!threadId
    });

    // SOLUTION 1: Create/Update Thread with User Context
    let thread;
    
    if (threadId) {
      // Use existing thread
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      // Create new thread with metadata
      thread = await openai.beta.threads.create({
        metadata: {
          userId: metadata.userId,
          studentName: userContext.firstName,
          lessonId: metadata.lessonId,
          courseId: metadata.courseId
        }
      });
    }

    // SOLUTION 2: Add System Message with User Data
    const systemMessage = `
You are a helpful AI assistant and conversational tutor.

CURRENT STUDENT: ${userContext.firstName} ${userContext.lastName}
- Preferred Name: ${userContext.firstName}
- Role: ${userContext.currentRole || 'Student'}
- Experience Level: ${userContext.experienceLevel || 'beginner'}
- Industry: ${userContext.industry || 'General'}
- Learning Goals: ${userContext.primaryGoals?.join(', ') || 'Skill development'}

IMPORTANT: Always address the student as "${userContext.firstName}" naturally in conversation.

Refer to the attached documents for your core response framework when interacting with ${userContext.firstName} and assessing their learning for that lesson.
    `;

    // Add the user's message to the thread
    const userMessage = messages.find(m => m.role === 'user');
    
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `${systemMessage}\n\nStudent Message: ${userMessage.content}`
    });

    // SOLUTION 3: Run Assistant with Enhanced Instructions
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: `
You are tutoring ${userContext.firstName}. 
Use their name naturally in responses.
Their experience level is ${userContext.experienceLevel}.
Focus on ${userContext.industry} examples when relevant.
Remember: This student's name is ${userContext.firstName} - use it!
      `
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'running' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      return Response.json({
        success: true,
        content: lastMessage.content[0].text.value,
        threadId: thread.id,
        userContext: {
          name: userContext.firstName,
          personalized: true
        }
      });
    } else {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to process message',
      details: error.message
    }, { status: 500 });
  }
}

// Alternative Implementation using Chat Completions (if not using Assistants)
export async function handleChatCompletion(userContext, userMessage) {
  const systemPrompt = `
You are a helpful AI assistant and conversational tutor for ${userContext.firstName}.

STUDENT INFORMATION:
- Name: ${userContext.firstName} ${userContext.lastName}
- Role: ${userContext.currentRole}
- Experience: ${userContext.experienceLevel}
- Industry: ${userContext.industry}
- Goals: ${userContext.primaryGoals?.join(', ')}

Always address them as ${userContext.firstName}. Tailor responses to their ${userContext.experienceLevel} level.
Use ${userContext.industry} examples when relevant.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    metadata: {
      studentName: userContext.firstName,
      studentId: userContext.userId
    }
  });

  return completion.choices[0].message.content;
}

console.log('🔗 OpenAI API Bridge Ready - User context will be injected!');
