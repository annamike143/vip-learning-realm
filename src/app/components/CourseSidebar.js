// --- src/app/components/CourseSidebar.js ---
'use client';
import React from 'react';
import Link from 'next/link';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import './CourseSidebar.css';

const CourseSidebar = ({ course, userProgress, courseId, activeLessonId }) => {
    const sortedModules = course.modules ? Object.keys(course.modules).sort((a,b) => course.modules[a].order - course.modules[b].order) : [];
    
    return (
        <aside className="course-sidebar">
            <div className="sidebar-header">
                <h3>{course.details.title}</h3>
                {/* Progress Bar will go here in a future refinement */}
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
                                   const isUnlocked = userProgress?.unlockedLessons?.[lessonId];
                                   const isCompleted = userProgress?.completedLessons?.[lessonId];
                                   return (
                                       <li key={lessonId}>
                                           <Link 
                                                href={isUnlocked ? `/course/${courseId}/${lessonId}` : '#'}
                                                className={`sidebar-lesson-link ${isUnlocked ? 'unlocked' : 'locked'} ${activeLessonId === lessonId ? 'active' : ''}`}
                                            >
                                               <span className="lesson-link-icon">{isCompleted ? <FaCheckCircle className="completed-icon"/> : (isUnlocked ? <div className="unlock-ring"></div> : <FaLock />)}</span>
                                               <span className="lesson-link-title">{lesson.title}</span>
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
export default CourseSidebar;