// --- src/app/components/ChatInterface.js (DIRECT API INTEGRATION VERSION) ---
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp, update } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { database } from '../lib/firebase';
import './ChatInterface.css'; // We will create this stylesheet

const ChatInterface = ({ title, assistantId, courseId, lessonId, chatType = "general" }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [threadId, setThreadId] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesDisplayRef = useRef(null);

    // Create separate thread paths for different chat types
    const threadPath = (() => {
        if (!user?.uid) return null;
        
        if (chatType === "recitation" && lessonId) {
            return `users/${user.uid}/enrollments/${courseId}/progress/lessonThreads/${lessonId}/recitation`;
        } else if (chatType === "qna") {
            return `users/${user.uid}/enrollments/${courseId}/progress/qnaThreads`;
        } else if (lessonId) {
            return `users/${user.uid}/enrollments/${courseId}/progress/lessonThreads/${lessonId}/general`;
        } else {
            return `messagingThreads/${courseId}/${user.uid}`;
        }
    })();

    useEffect(() => {
        if (!user || !courseId) return;
        const dbRef = ref(database, threadPath);
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            setThreadId(data?.assistantThreadId || null);
            const messageList = data?.messages ? Object.values(data.messages) : [];
            setMessages(messageList);
        });
        return () => unsubscribe();
    }, [user, courseId, lessonId, threadPath]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Check if scroll indicator should be shown
    const checkScrollIndicator = () => {
        if (messagesDisplayRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesDisplayRef.current;
            setShowScrollIndicator(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 50);
        }
    };
    
    useEffect(scrollToBottom, [messages]);
    useEffect(checkScrollIndicator, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isLoading || !assistantId || !user) return;
        
        const userMessage = newMessage;
        setNewMessage('');
        setIsLoading(true);

        const messageRef = ref(database, `${threadPath}/messages`);
        await push(messageRef, { sender: 'user', text: userMessage, timestamp: serverTimestamp() });

        // --- DEFENSIVE PAYLOAD CONSTRUCTION ---
        console.log("SENDING TO LOCAL API:");
        console.log({ assistantId, threadId, message: userMessage, courseId, userId: user.uid, lessonId });
        
        try {
            // Prepare payload for local API
            const payload = { 
                assistantId, 
                message: userMessage, 
                courseId, 
                userId: user.uid,
                chatType: chatType
            };
            
            // Add lessonId only if it's a valid string (not undefined/null)
            if (typeof lessonId === 'string' && lessonId) {
                payload.lessonId = lessonId;
            }
            
            // Add threadId only if it's a valid string  
            if (typeof threadId === 'string' && threadId) {
                payload.threadId = threadId;
            }
            
            console.log("[DEBUG] Payload to local API:", payload);
            
            // Call local Next.js API route instead of Firebase Function
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }
            
            if (result.success) {
                await push(messageRef, { sender: 'assistant', text: result.response, timestamp: serverTimestamp() });
                
                // Handle unlock code for recitation
                if (result.unlockCode && chatType === "recitation") {
                    await push(messageRef, { 
                        sender: 'system', 
                        text: `🎉 Congratulations! Your unlock code is: ${result.unlockCode}`, 
                        timestamp: serverTimestamp(),
                        isUnlockCode: true
                    });
                }
                
                if (result.threadId) {
                    console.log("[DEBUG] Updating local threadId:", result.threadId);
                    setThreadId(result.threadId); // Always update local threadId
                    if (!threadId) {
                        // Save the new threadId back to the database
                        await update(ref(database, threadPath), { assistantThreadId: result.threadId });
                    }
                }
            }
        } catch (error) {
            console.error("Error from local API:", error);
            await push(messageRef, { sender: 'assistant', text: `Sorry, an error occurred: ${error.message}`, timestamp: serverTimestamp() });
        }
        setIsLoading(false);
    };

    return (
        <div className="chat-portal">
            {title && <h3>{title}</h3>}
            <div 
                className="messages-display" 
                ref={messagesDisplayRef}
                onScroll={checkScrollIndicator}
            >
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        <span>{msg.sender === 'assistant' ? (chatType === 'recitation' ? 'AI Coach' : 'AI Concierge') : 'You'}</span>
                        <p>{msg.text}</p>
                    </div>
                ))}
                {isLoading && <div className="message assistant typing"><span>AI is typing...</span><div className="typing-indicator"><span></span><span></span><span></span></div></div>}
                <div ref={messagesEndRef} />
                {showScrollIndicator && (
                    <div className="scroll-indicator">
                        <span>↓ Scroll to see more messages</span>
                    </div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder={chatType === "recitation" ? "Practice what you've learned..." : "Ask for help or support..."} 
                    disabled={!assistantId || isLoading} 
                />
                <button type="submit" disabled={isLoading || !assistantId}>{isLoading ? '...' : 'Send'}</button>
            </form>
        </div>
    );
};

export default ChatInterface;