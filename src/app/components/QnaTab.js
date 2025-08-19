// --- src/app/components/QnaTab.js ---
'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

const QnaTab = ({ courseData, user }) => {
    if (!user || !courseData?.qaAssistantId) {
        return (
            <div className="chat-portal">
                <h3>Course Q&A / Support</h3>
                <div className="messages-display">
                    <div className="message assistant">
                        <span>AI Concierge</span>
                        <p>Loading AI assistant... (Assistant ID required)</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <ChatInterface 
                title="Course Q&A / Support" 
                assistantId={courseData.qaAssistantId}
                user={user}
                courseId={courseData.id}
                lessonId={null}
            />
        </div>
    );
};

export default QnaTab;