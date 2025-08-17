// --- src/app/course/[courseId]/layout.js ---
'use client';
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import CourseSidebar from '../../components/CourseSidebar';
import '../../components/CourseSidebar.css';
import './course-layout.css';

export default function CourseLayout({ children, params }) {
    const { courseId } = params;
    const { user, loading: authLoading } = useAuth();
    const [courseData, setCourseData] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!courseId || !user) return;
        const courseRef = ref(database, `courses/${courseId}`);
        const progressRef = ref(database, `users/${user.uid}/enrollments/${courseId}/progress`);
        const unsubCourse = onValue(courseRef, (snapshot) => setCourseData(snapshot.val()));
        const unsubProgress = onValue(progressRef, (snapshot) => setUserProgress(snapshot.val()));
        setLoading(false);
        return () => { unsubCourse(); unsubProgress(); };
    }, [courseId, user]);

    if (authLoading || loading || !courseData) {
        return <div>Loading Course Environment...</div>;
    }

    return (
        <div className="course-layout">
            <CourseSidebar 
                course={courseData} 
                userProgress={userProgress} 
                courseId={courseId}
                activeLessonId={params.lessonId}
            />
            <main className="main-content-area">
                {children}
            </main>
        </div>
    );
}