// --- DIAGNOSTIC TEST COMPONENT ---
// Save this as src/app/test-chat.js and navigate to /test-chat to test

'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export default function TestChat() {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testChatFunction = async () => {
        setLoading(true);
        setResult('');
        
        const chatWithAssistant = httpsCallable(functions, 'chatWithAssistant');
        
        // Test with various scenarios
        const testCases = [
            {
                name: "Test 1: Valid threadId",
                payload: {
                    assistantId: "asst_vasQ2In09rEbrrrS5uZJhkYR",
                    threadId: "thread_test123",
                    message: "Hello",
                    courseId: "test_course",
                    userId: "test_user",
                    lessonId: "test_lesson"
                }
            },
            {
                name: "Test 2: No threadId (undefined)",
                payload: {
                    assistantId: "asst_vasQ2In09rEbrrrS5uZJhkYR",
                    message: "Hello",
                    courseId: "test_course", 
                    userId: "test_user",
                    lessonId: "test_lesson"
                }
            },
            {
                name: "Test 3: Null threadId",
                payload: {
                    assistantId: "asst_vasQ2In09rEbrrrS5uZJhkYR",
                    threadId: null,
                    message: "Hello",
                    courseId: "test_course",
                    userId: "test_user", 
                    lessonId: "test_lesson"
                }
            }
        ];

        let results = '';
        
        for (const testCase of testCases) {
            try {
                console.log(`Running ${testCase.name}:`, testCase.payload);
                const response = await chatWithAssistant(testCase.payload);
                results += `${testCase.name}: SUCCESS\n`;
                results += `Response: ${JSON.stringify(response.data, null, 2)}\n\n`;
            } catch (error) {
                results += `${testCase.name}: ERROR\n`;
                results += `Error: ${error.message}\n\n`;
            }
        }
        
        setResult(results);
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>ChatWithAssistant Diagnostic Test</h1>
            <button onClick={testChatFunction} disabled={loading}>
                {loading ? 'Testing...' : 'Run Tests'}
            </button>
            
            <pre style={{ 
                background: '#f5f5f5', 
                padding: '20px', 
                marginTop: '20px',
                whiteSpace: 'pre-wrap',
                fontSize: '12px'
            }}>
                {result || 'Click "Run Tests" to start diagnostic'}
            </pre>
        </div>
    );
}
