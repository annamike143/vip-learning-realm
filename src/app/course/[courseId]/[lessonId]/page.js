// --- src/app/course/[courseId]/[lessonId]/page.js ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../lib/firebase'; // Note path goes up 3 levels
import Link from 'next/link';
import './course-layout.css';

// Placeholder for the Sidebar component we will create next
const CourseSidebar = ({ course, userProgress, courseId, activeLessonId }) => {
    const sortedModules = course.modules ? Object.keys(course.modules).sort((a,b) => course.modules[a].order - course.modules[b].order) : [];
    return (
        <aside className="course-sidebar">
            <div className="sidebar-header">
                <h3>{course.details.title}</h3>
                {/* Progress Bar will go here */}
            </div>
            <div className="sidebar-modules">
                {sortedModules.map(moduleId => {
                    const moduleData = course.modules[moduleId];
                    const sortedLessons = moduleData.lessons ? Object.keys(moduleData.lessons).sort((a,b) => moduleData.lessons[a].order - moduleData.lessons[b].order) : [];
                    return (
                        <div key={moduleId} className="module-group">
                           <h4>{moduleData.title}</h4>
                           <ul>
                               {sortedLessons.map(lessonId => {
                                   const lesson = moduleData.lessons[lessonId];
                                   const isUnlocked = userProgress?.unlockedLessons?.includes(lessonId);
                                   return (
                                       <li key={lessonId}>
                                           <Link 
                                                href={isUnlocked ? `/course/${courseId}/${lessonId}` : '#'}
                                                className={`${isUnlocked ? 'unlocked' : 'locked'} ${activeLessonId === lessonId ? 'active' : ''}`}
                                            >
                                               {lesson.title}
                                           </Link>
                                       </li>
                                   );
                               })}
                           </ul>
                        </div>
                    )
                })}
            </div>
        </aside>
    );
};

// Placeholder for the Lesson Content component
const LessonContent = ({ lesson }) => {
    return (
        <div className="lesson-content-area">
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
            <div 
                className="video-container"
                dangerouslySetInnerHTML={{ __html: lesson.videoEmbedCode }}
            />
            {/* AI Recitation and Q&A will go here */}
        </div>
    );
};


export default function CoursePage({ params }) {
    const { courseId, lessonId } = params;
    const [courseData, setCourseData] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // This simulates getting the current logged-in user.
    // In a real app, this would come from your auth context.
    const [user, setUser] = useState({ uid: 'test_user_placeholder' }); 

    useEffect(() => {
        if (!courseId || !user) return;
        
        const courseRef = ref(database, `courses/${courseId}`);
        const progressRef = ref(database, `users/${user.uid}/enrollments/${courseId}/progress`);

        const unsubCourse = onValue(courseRef, (snapshot) => setCourseData(snapshot.val()));
        const unsubProgress = onValue(progressRef, (snapshot) => setUserProgress(snapshot.val()));

        Promise.all([
            new Promise(resolve => onValue(courseRef, r => resolve(r.val()))),
            new Promise(resolve => onValue(progressRef, r => resolve(r.val())))
        ]).then(([course, progress]) => {
            if (!course) setError('Course not found.');
            setLoading(false);
        });

        return () => { unsubCourse(); unsubProgress(); };
    }, [courseId, user]);

    if (loading) return <div>Loading Course...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!courseData) return <div>Course data could not be loaded.</div>;

    const currentLesson = courseData.modules ? 
        Object.values(courseData.modules)
            .flatMap(m => m.lessons ? Object.entries(m.lessons) : [])
            .find(([id, data]) => id === lessonId)?.[1]
        : null;

    return (
        <div className="course-layout">
            <CourseSidebar 
                course={courseData} 
                userProgress={userProgress} 
                courseId={courseId}
                activeLessonId={lessonId}
            />
            <main className="main-content-area">
                {currentLesson ? (
                    <LessonContent lesson={currentLesson} />
                ) : (
                    <div>Please select a lesson to begin.</div>
                )}
            </main>
        </div>
    );
}