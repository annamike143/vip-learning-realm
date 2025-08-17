// --- src/app/components/RecitationTab.js ---
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

const RecitationTab = ({ lessonData, unlockCode, setUnlockCode, handleUnlock, unlockStatus }) => {
    return (
        <div>
            <ChatInterface title="Lesson Recitation" assistantId={lessonData.recitationAssistantId} />
            <div className="unlock-gate">
                <h3>Ready to Proceed?</h3>
                <p>After completing the AI recitation, enter the code you received to unlock the next lesson.</p>
                <div className="unlock-form">
                    <input 
                        type="text" 
                        value={unlockCode} 
                        onChange={e => setUnlockCode(e.target.value)} 
                        placeholder="Enter Unlock Code" 
                    />
                    <button onClick={handleUnlock}>Unlock</button>
                </div>
                {unlockStatus.message && <p className={`status-message ${unlockStatus.error ? 'error' : 'success'}`}>{unlockStatus.message}</p>}
            </div>
        </div>
    );
};

export default RecitationTab;