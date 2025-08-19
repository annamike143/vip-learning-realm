// --- src/app/components/RecitationTab.js ---
'use client';

import React from 'react';
import ChatInterface from './ChatInterface';

const RecitationTab = ({ lessonData, unlockCode, setUnlockCode, handleUnlock, unlockStatus, user, courseId, lessonId }) => {
    return (
        <div>
            {lessonData?.recitationAssistantId ? (
                <ChatInterface 
                    title="Lesson Recitation" 
                    assistantId={lessonData.recitationAssistantId} 
                    user={user}
                    courseId={courseId}
                    lessonId={lessonId}
                />
            ) : (
                <div className="chat-portal">
                    <h3>Lesson Recitation</h3>
                    <div className="messages-display">
                        <div className="message assistant">
                            <span>AI Coach</span>
                            <p>Loading AI assistant... (Recitation Assistant ID required)</p>
                        </div>
                    </div>
                </div>
            )}
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