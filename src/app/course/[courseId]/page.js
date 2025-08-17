// --- src/app/course/[courseId]/page.js ---
'use client';
import React from 'react';

export default function CourseHomePage() {
    return (
        <div style={{padding: '2rem'}}>
            <h2>Welcome to the course!</h2>
            <p>Please select a lesson from the sidebar to begin.</p>
        </div>
    );
}