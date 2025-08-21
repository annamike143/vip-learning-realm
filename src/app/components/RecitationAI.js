// RecitationAI.js - OpenAI Integration with User Context
// This component bridges your Firebase user data with OpenAI Assistant

import React, { useState, useEffect, useRef } from 'react';
import { getAIContext } from '../lib/simplifiedAI';
import { OpenAIPersonalizationBridge } from '../lib/openAIDataBridge';

const RecitationAI = ({ userId, lessonId, courseId }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userContext, setUserContext] = useState(null);
    const [openAIThread, setOpenAIThread] = useState(null);
    const bridgeRef = useRef(new OpenAIPersonalizationBridge());

    // Your OpenAI Assistant ID (replace with actual ID)
    const ASSISTANT_ID = 'asst_your_assistant_id_here';

    useEffect(() => {
        initializeChat();
    }, [userId]);

    const initializeChat = async () => {
        try {
            // Get user context from Firebase
            const context = await bridgeRef.current.initializeUserSession(userId, ASSISTANT_ID);
            setUserContext(context);

            // Create initial greeting with user's name
            const greeting = `Hello ${context.firstName}! I'm here to help you with your recitation for this lesson. What would you like to practice today?`;
            
            setMessages([{
                id: 1,
                role: 'assistant',
                content: greeting,
                timestamp: new Date()
            }]);

        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    };

    const sendMessageToOpenAI = async (userMessage) => {
        if (!userContext) return;

        setIsLoading(true);
        
        try {
            // Prepare message with user context for OpenAI
            const { message: enhancedMessage, userContext: currentContext } = 
                await bridgeRef.current.sendMessageWithContext(userId, userMessage);

            // Create the system prompt with user data
            const systemPrompt = bridgeRef.current.getSystemMessageForUser(currentContext);

            // THIS IS WHERE THE MAGIC HAPPENS:
            // Call OpenAI API with user context embedded
            const openAIResponse = await callOpenAIAssistant({
                assistantId: ASSISTANT_ID,
                threadId: openAIThread?.id,
                systemMessage: systemPrompt,
                userMessage: enhancedMessage,
                userContext: currentContext
            });

            // Update thread ID for continuation
            if (openAIResponse.threadId) {
                setOpenAIThread({ id: openAIResponse.threadId });
            }

            // Add messages to chat
            const newUserMessage = {
                id: Date.now(),
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            };

            const newAssistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: openAIResponse.content,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, newUserMessage, newAssistantMessage]);

        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            // Add error message
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'system',
                content: 'Sorry, there was an error processing your message. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setInputMessage('');
        }
    };

    // This function calls your OpenAI API
    const callOpenAIAssistant = async ({ assistantId, threadId, systemMessage, userMessage, userContext }) => {
        // OPTION 1: Using OpenAI Assistants API
        const response = await fetch('/api/openai-assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assistantId,
                threadId,
                messages: [
                    {
                        role: "system",
                        content: systemMessage // Contains user's firstName, etc.
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                userContext, // Send full context for additional processing
                metadata: {
                    userId,
                    lessonId,
                    courseId,
                    studentName: userContext.firstName
                }
            })
        });

        return await response.json();
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            sendMessageToOpenAI(inputMessage.trim());
        }
    };

    return (
        <div className="recitation-ai">
            <div className="ai-header">
                <h3>AI Tutor {userContext && `for ${userContext.firstName}`}</h3>
                <p>Practice and discuss your lesson content</p>
            </div>

            <div className="chat-container">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.role}`}>
                        <div className="message-content">
                            {message.content}
                        </div>
                        <div className="message-time">
                            {message.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message assistant loading">
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Ask a question, ${userContext?.firstName || 'Student'}...`}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !inputMessage.trim()}>
                    Send
                </button>
            </form>

            {/* Debug panel to show what data OpenAI receives */}
            {process.env.NODE_ENV === 'development' && userContext && (
                <div className="debug-panel">
                    <h4>🔍 Data sent to OpenAI:</h4>
                    <pre>{JSON.stringify({
                        studentName: userContext.firstName,
                        fullName: userContext.fullName,
                        role: userContext.currentRole,
                        level: userContext.experienceLevel,
                        industry: userContext.industry
                    }, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default RecitationAI;
