// --- src/app/components/QnaTab.js ---
'use client';

import React from 'react';

// A placeholder ChatInterface for now
const ChatInterface = ({ title }) => (
    <div className="chat-portal">
        <h3>{title}</h3>
        <div className="messages-display">
            <div className="message assistant">
                <span>{title === 'Lesson Recitation' ? 'AI Coach' : 'AI Concierge'}</span>
                <p>The AI chat interface will be activated here.</p>
            </div>
        </div>
        <form className="message-form">
            <input type="text" placeholder="Your conversation begins here..." disabled />
            <button type="submit" disabled>Send</button>
        </form>
    </div>
);

const QnaTab = ({ courseData, user }) => {
    return (
        <div>
            <ChatInterface title="Course Q&A / Support" courseId={courseData.id} user={user} />
        </div>
    );
};

export default QnaTab;