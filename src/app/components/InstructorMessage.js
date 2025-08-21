// --- src/app/components/InstructorMessage.js ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import { useTheme } from './ThemeProvider';
import './InstructorMessage.css';

const InstructorMessage = ({ courseId, lessonId }) => {
    const { customBranding } = useTheme();
    const [instructorData, setInstructorData] = useState(null);
    const [courseDetails, setCourseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!courseId) return;

        // Load course branding/instructor data
        const brandingRef = ref(database, `courses/${courseId}/branding`);
        const courseRef = ref(database, `courses/${courseId}/details`);

        const unsubBranding = onValue(brandingRef, (snapshot) => {
            const brandingData = snapshot.val();
            setInstructorData(brandingData || {});
            setLoading(false);
        });

        const unsubCourse = onValue(courseRef, (snapshot) => {
            const courseData = snapshot.val();
            setCourseDetails(courseData || {});
        });

        return () => {
            unsubBranding();
            unsubCourse();
        };
    }, [courseId]);

    if (loading) {
        return (
            <div className="instructor-message loading">
                <div className="instructor-skeleton">
                    <div className="avatar-skeleton"></div>
                    <div className="content-skeleton">
                        <div className="line-skeleton"></div>
                        <div className="line-skeleton short"></div>
                    </div>
                </div>
            </div>
        );
    }

    const welcomeMessage = instructorData?.instructorMessage || 
        customBranding?.instructorMessage || 
        `Welcome to ${courseDetails?.title || 'this course'}! I'm excited to guide you through this learning journey.`;

    const instructorName = instructorData?.instructorName || 
        customBranding?.instructorName || 
        'Your Instructor';

    const instructorAvatar = instructorData?.instructorPhoto || 
        customBranding?.instructorPhoto || 
        null;

    const shouldTruncate = welcomeMessage.length > 150;
    const displayMessage = (shouldTruncate && !isExpanded) 
        ? welcomeMessage.substring(0, 150) + '...' 
        : welcomeMessage;

    return (
        <div className="instructor-message">
            <div className="instructor-header">
                <div className="instructor-avatar">
                    {instructorAvatar ? (
                        <img src={instructorAvatar} alt={instructorName} />
                    ) : (
                        <div className="avatar-placeholder">
                            {instructorName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="instructor-info">
                    <h4 className="instructor-name">{instructorName}</h4>
                    <span className="instructor-role">Course Instructor</span>
                </div>
                <div className="message-indicator">
                    💬
                </div>
            </div>
            
            <div className="instructor-content">
                <p className="welcome-message">
                    {displayMessage}
                </p>
                
                {shouldTruncate && (
                    <button 
                        className="expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                )}
            </div>
            
            {instructorData?.lastUpdated && (
                <div className="message-meta">
                    <span className="update-time">
                        Updated {new Date(instructorData.lastUpdated).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default InstructorMessage;
