// --- Professional Support Chat Widget ---
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, off, serverTimestamp } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { trackUserInteraction } from '../analytics/analytics';

const SupportChat = ({ position = 'bottom-right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [supportAgentOnline, setSupportAgentOnline] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    // Initialize chat session
    useEffect(() => {
        if (isOpen && user && !chatId) {
            initializeChat();
        }
    }, [isOpen, user]);

    // Listen for messages
    useEffect(() => {
        if (chatId) {
            const messagesRef = ref(database, `support_chats/${chatId}/messages`);
            onValue(messagesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const messagesList = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                    setMessages(messagesList);
                }
            });

            return () => off(messagesRef);
        }
    }, [chatId]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check support agent status (mock for demo)
    useEffect(() => {
        // In a real implementation, this would check actual agent availability
        const checkAgentStatus = () => {
            const businessHours = isBusinessHours();
            setSupportAgentOnline(businessHours);
        };

        checkAgentStatus();
        const interval = setInterval(checkAgentStatus, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const isBusinessHours = () => {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        // Monday-Friday, 9 AM - 6 PM (adjust for your timezone)
        return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
    };

    const initializeChat = async () => {
        if (!user) return;

        setIsLoading(true);
        
        try {
            const chatData = {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'VIP Member',
                status: 'active',
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp()
            };

            const chatsRef = ref(database, 'support_chats');
            const newChatRef = await push(chatsRef, chatData);
            setChatId(newChatRef.key);

            // Send welcome message
            await addMessage('system', "Hello! I'm here to help. How can I assist you today?");
            
            // Track chat initiation
            trackUserInteraction('support_chat_started', 'support_widget');

        } catch (error) {
            console.error('Error initializing chat:', error);
        }
        
        setIsLoading(false);
    };

    const addMessage = async (sender, text, type = 'text') => {
        if (!chatId) return;

        const messageData = {
            sender, // 'user', 'agent', 'system'
            text,
            type,
            timestamp: Date.now(),
            read: sender === 'user'
        };

        const messagesRef = ref(database, `support_chats/${chatId}/messages`);
        await push(messagesRef, messageData);

        // Update last activity
        const chatRef = ref(database, `support_chats/${chatId}`);
        await push(chatRef, { lastActivity: serverTimestamp() });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatId) return;

        const message = newMessage.trim();
        setNewMessage('');

        await addMessage('user', message);
        
        // Track user message
        trackUserInteraction('support_message_sent', 'support_widget');

        // Auto-reply for demo (in real implementation, this would be handled by agents)
        setTimeout(() => {
            if (supportAgentOnline) {
                addMessage('agent', "Thanks for your message! A support agent will respond shortly.");
            } else {
                addMessage('system', "We're currently outside business hours. We'll respond to your message during our next business day (Mon-Fri, 9 AM - 6 PM).");
            }
        }, 2000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getQuickReplies = () => [
        "I need help with a lesson",
        "I can't access my course",
        "Technical issue",
        "Billing question",
        "Feature request"
    ];

    const handleQuickReply = (text) => {
        setNewMessage(text);
    };

    return (
        <div className={`support-chat ${position} ${isOpen ? 'open' : ''}`}>
            {/* Chat Trigger Button */}
            {!isOpen && (
                <button
                    className="chat-trigger"
                    onClick={() => setIsOpen(true)}
                    title="Need Help?"
                >
                    <span className="chat-icon">💬</span>
                    {supportAgentOnline && <span className="online-indicator"></span>}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="header-info">
                            <h3>🎓 VIP Support</h3>
                            <span className={`status ${supportAgentOnline ? 'online' : 'offline'}`}>
                                {supportAgentOnline ? '🟢 Online' : '🔴 Offline'}
                            </span>
                        </div>
                        <button
                            className="close-chat"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {isLoading ? (
                            <div className="loading-message">
                                <div className="loading-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <p>Connecting to support...</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`message ${message.sender}`}
                                    >
                                        <div className="message-content">
                                            <p>{message.text}</p>
                                            <span className="message-time">
                                                {formatTime(message.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Quick Replies (show after welcome message) */}
                                {messages.length === 1 && messages[0]?.sender === 'system' && (
                                    <div className="quick-replies">
                                        <p>Quick options:</p>
                                        {getQuickReplies().map((reply, index) => (
                                            <button
                                                key={index}
                                                className="quick-reply-btn"
                                                onClick={() => handleQuickReply(reply)}
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="chat-input">
                        <form onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isLoading || !chatId}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isLoading || !chatId}
                                aria-label="Send message"
                            >
                                📤
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="chat-footer">
                        <p>
                            {supportAgentOnline 
                                ? "We'll respond within a few minutes" 
                                : "We'll respond during business hours"
                            }
                        </p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .support-chat {
                    position: fixed;
                    z-index: 1001;
                    font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
                }
                
                .support-chat.bottom-right {
                    bottom: 90px;
                    right: 20px;
                }
                
                .support-chat.bottom-left {
                    bottom: 90px;
                    left: 20px;
                }
                
                .chat-trigger {
                    position: relative;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--color-accent, #FFD700);
                    color: var(--color-text, #333);
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .chat-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                
                .online-indicator {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    width: 12px;
                    height: 12px;
                    background: #4CAF50;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                
                .chat-window {
                    width: 350px;
                    height: 500px;
                    background: var(--color-surface, white);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    border: 1px solid var(--color-border, #e0e0e0);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .chat-header {
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .header-info h3 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .status {
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .close-chat {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .close-chat:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .loading-message {
                    text-align: center;
                    padding: 20px;
                    color: var(--color-textSecondary, #666);
                }
                
                .loading-dots {
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                    margin-bottom: 10px;
                }
                
                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    background: var(--color-primary, #00A9E0);
                    border-radius: 50%;
                    animation: bounce 1.4s ease-in-out infinite both;
                }
                
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                
                .message {
                    display: flex;
                    margin: 4px 0;
                }
                
                .message.user {
                    justify-content: flex-end;
                }
                
                .message.agent,
                .message.system {
                    justify-content: flex-start;
                }
                
                .message-content {
                    max-width: 80%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    position: relative;
                }
                
                .message.user .message-content {
                    background: var(--color-primary, #00A9E0);
                    color: white;
                }
                
                .message.agent .message-content {
                    background: var(--color-surface-variant, #f5f5f5);
                    color: var(--color-text, #333);
                }
                
                .message.system .message-content {
                    background: var(--color-accent-light, #fff3cd);
                    color: var(--color-text, #333);
                    font-style: italic;
                }
                
                .message-content p {
                    margin: 0 0 4px 0;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .message-time {
                    font-size: 11px;
                    opacity: 0.7;
                }
                
                .quick-replies {
                    margin: 10px 0;
                }
                
                .quick-replies p {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    color: var(--color-textSecondary, #666);
                }
                
                .quick-reply-btn {
                    display: block;
                    width: 100%;
                    margin: 4px 0;
                    padding: 8px 12px;
                    background: transparent;
                    border: 1px solid var(--color-border, #ddd);
                    border-radius: 16px;
                    color: var(--color-text, #333);
                    cursor: pointer;
                    font-size: 13px;
                    text-align: left;
                    transition: all 0.2s;
                }
                
                .quick-reply-btn:hover {
                    background: var(--color-surface-variant, #f5f5f5);
                    border-color: var(--color-primary, #00A9E0);
                }
                
                .chat-input {
                    border-top: 1px solid var(--color-border, #e0e0e0);
                    padding: 12px;
                }
                
                .chat-input form {
                    display: flex;
                    gap: 8px;
                }
                
                .chat-input input {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid var(--color-border, #ddd);
                    border-radius: 20px;
                    font-size: 14px;
                    outline: none;
                }
                
                .chat-input input:focus {
                    border-color: var(--color-primary, #00A9E0);
                }
                
                .chat-input button {
                    padding: 10px 12px;
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                
                .chat-input button:hover:not(:disabled) {
                    background: var(--color-primary-dark, #0088b3);
                }
                
                .chat-input button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .chat-footer {
                    padding: 8px 16px;
                    background: var(--color-surface-variant, #f9f9f9);
                    border-top: 1px solid var(--color-border, #e0e0e0);
                    text-align: center;
                }
                
                .chat-footer p {
                    margin: 0;
                    font-size: 11px;
                    color: var(--color-textSecondary, #666);
                }
            `}</style>
        </div>
    );
};

export default SupportChat;
