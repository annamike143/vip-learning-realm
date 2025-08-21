// --- AI Personalization Test Component ---
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { simplifiedAI, getAIContext } from '../lib/simplifiedAI';
import { generateOpenAISystemPrompt } from '../lib/openaiIntegration';

export default function AITestPage() {
    const { user } = useAuth();
    const [userContext, setUserContext] = useState(null);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [personalizedMessage, setPersonalizedMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadUserContext();
        }
    }, [user]);

    const loadUserContext = async () => {
        setLoading(true);
        try {
            // Initialize user profile
            await simplifiedAI.enrichUserProfile(user.uid, {
                firstName: user.displayName?.split(' ')[0] || 'Student',
                lastName: user.displayName?.split(' ')[1] || '',
                email: user.email || '',
                currentRole: 'Marketing Professional', // Test data
                industryInterest: 'Technology',
                skillLevel: 'intermediate',
                primaryGoals: ['Career advancement', 'Skill development']
            });

            // Get context for OpenAI
            const context = await getAIContext(user.uid);
            setUserContext(context);

            // Generate system prompt
            const prompt = generateOpenAISystemPrompt(context);
            setSystemPrompt(prompt);

        } catch (error) {
            console.error('Error loading user context:', error);
        } finally {
            setLoading(false);
        }
    };

    const testPersonalization = () => {
        if (!userContext) return;

        const template = "Welcome to this lesson, {firstName}! As a {currentRole}, you'll find this content valuable for {primaryGoals}. Let's get started!";
        
        const personalized = simplifiedAI.personalizeInstructorMessage(template, userContext);
        setPersonalizedMessage(personalized);
    };

    const handleCustomMessage = () => {
        if (!userContext || !testMessage) return;

        const personalized = simplifiedAI.personalizeInstructorMessage(testMessage, userContext);
        setPersonalizedMessage(personalized);
    };

    if (!user) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Please log in to test AI personalization</h2>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Loading AI context...</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>🤖 AI Personalization Test</h1>
            <p>Testing the simplified AI system that works with OpenAI Assistant</p>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                <h3>👤 User Context (for OpenAI)</h3>
                {userContext ? (
                    <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                        {JSON.stringify(userContext, null, 2)}
                    </pre>
                ) : (
                    <p>No user context available</p>
                )}
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
                <h3>🎯 OpenAI System Prompt</h3>
                <textarea 
                    value={systemPrompt}
                    readOnly
                    style={{ 
                        width: '100%', 
                        height: '200px', 
                        padding: '0.5rem',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                    }}
                />
                <p><small>This prompt would be sent to OpenAI Assistant to provide user context</small></p>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0fff0', borderRadius: '8px' }}>
                <h3>✨ Message Personalization Test</h3>
                
                <button 
                    onClick={testPersonalization}
                    style={{
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    Test Default Message
                </button>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Custom Message Template:
                    </label>
                    <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Enter message with {firstName}, {currentRole}, etc."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            marginBottom: '0.5rem'
                        }}
                    />
                    <button 
                        onClick={handleCustomMessage}
                        disabled={!testMessage}
                        style={{
                            background: testMessage ? '#3b82f6' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: testMessage ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Personalize Custom Message
                    </button>
                </div>

                {personalizedMessage && (
                    <div style={{ 
                        background: 'white', 
                        padding: '1rem', 
                        borderRadius: '6px',
                        border: '2px solid #22c55e'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#22c55e' }}>Personalized Result:</h4>
                        <p style={{ margin: 0, fontSize: '1.1rem' }}>{personalizedMessage}</p>
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '8px' }}>
                <h3>📋 Available Variables</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    <code>{'{firstName}'}</code>
                    <code>{'{lastName}'}</code>
                    <code>{'{fullName}'}</code>
                    <code>{'{preferredName}'}</code>
                    <code>{'{email}'}</code>
                    <code>{'{currentRole}'}</code>
                </div>
                <p><small>These variables are automatically replaced with user data</small></p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <h3>🔗 Integration Notes</h3>
                <ul style={{ margin: 0 }}>
                    <li>This system collects user data and provides basic personalization</li>
                    <li>OpenAI Assistant receives rich user context via system prompts</li>
                    <li>No conflicts with OpenAI's knowledge base or response generation</li>
                    <li>Perfect for instructor messages and user-specific content</li>
                </ul>
            </div>
        </div>
    );
}
