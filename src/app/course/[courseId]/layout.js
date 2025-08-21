// --- src/app/course/[courseId]/layout.js (v3.0 - DEFINITIVE REFACTOR) ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import CourseSidebar from '../../components/CourseSidebar';
import KajabiHeader from '../../components/KajabiHeader';
import ThemeProvider from '../../components/ThemeProvider';
import '../../components/CourseSidebar.css';
import '../../components/KajabiHeader.css';
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

    if (authLoading || loading || !courseData) {
        return <div className="loading-state">Loading Course Environment...</div>;
    }

    return (
        <ThemeProvider courseId={courseId}>
            <div className="course-page-wrapper">
                {/* Kajabi-Style Header */}
                <KajabiHeader 
                    user={user}
                    courseData={courseData}
                    userProgress={userProgress}
                    currentPath={`/course/${courseId}`}
                />

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
        </ThemeProvider>
    );
}