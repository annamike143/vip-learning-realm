// --- src/app/course/[courseId]/layout.js (v3.0 - DEFINITIVE REFACTOR) ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from "firebase/auth";
import Link from 'next/link';
import CourseSidebar from '../../components/CourseSidebar';
import '../../components/CourseSidebar.css';
import './lesson-page.css';

export default function CourseLayout({ children, params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();
    const [courseData, setCourseData] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { if (typeof window !== 'undefined') window.location.href = '/'; return; }
        if (!courseId) return;
        
        const courseRef = ref(database, `courses/${courseId}`);
        const progressRef = ref(database, `users/${user.uid}/enrollments/${courseId}/progress`);

        const unsubCourse = onValue(courseRef, (snapshot) => {
            setCourseData(snapshot.val());
            setLoading(false);
        });
        const unsubProgress = onValue(progressRef, (snapshot) => setUserProgress(snapshot.val()));
        
        return () => { unsubCourse(); unsubProgress(); };
    }, [courseId, user, authLoading]);

    const handleSignOut = () => { signOut(auth); };

    if (authLoading || loading || !courseData) {
        return <div className="loading-state">Loading Course Environment...</div>;
    }

    return (
        <div className="course-page-wrapper">
            {/* --- The New "Context Realm" Header --- */}
            <header className="main-app-header">
                {/* Your new logo will go here later */}
                <Link href="/" className="header-course-title">{courseData.details.title}</Link>
                <div className="header-user-menu">
                    {/* The progress bar will be added here later */}
                    <span>Welcome, {user.displayName || 'VIP Member'}</span>
                    <button onClick={handleSignOut} className="signout-button">Sign Out</button>
                </div>
            </header>

            <div className="course-layout">
                <CourseSidebar 
                    course={courseData} 
                    userProgress={userProgress} 
                    courseId={courseId}
                    activeLessonId={lessonId}
                />
                <main className="main-content-area">
                    {children}
                </main>
            </div>
        </div>
    );
}