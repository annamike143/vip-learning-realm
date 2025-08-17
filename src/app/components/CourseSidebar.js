// --- src/app/components/CourseSidebar.js (v2.0 - DEFINITIVE FINAL VERSION) ---
'use client';

import React from 'react';
import Link from 'next/link';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import './CourseSidebar.css';

const CourseSidebar = ({ course, userProgress, courseId, activeLessonId }) => {
    const sortedModules = course.modules ? Object.keys(course.modules).sort((a,b) => course.modules[a].order - course.modules[b].order) : [];
    
    // --- NEW: Calculate total and completed lessons for the progress bar ---
    const allLessons = sortedModules.flatMap(moduleId => 
        course.modules[moduleId].lessons ? Object.keys(course.modules[moduleId].lessons) : []
    );
    const totalLessonsCount = allLessons.length;
    const completedLessonsCount = userProgress?.completedLessons ? Object.keys(userProgress.completedLessons).length : 0;
    const progressPercentage = totalLessonsCount > 0 ? (completedLessonsCount / totalLessonsCount) * 100 : 0;


    return (
        <aside className="course-sidebar">
            <div className="sidebar-header">
                <h3>{course.details.title}</h3>
                {/* --- NEW: The Progress Bar --- */}
                <div className="sidebar-progress">
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span>{completedLessonsCount} of {totalLessonsCount} lessons completed</span>
                </div>
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
                                   const isActive = activeLessonId === lessonId;

                                   return (
                                       <li key={lessonId}>
                                           <Link 
                                                href={isUnlocked ? `/course/${courseId}/${lessonId}` : '#'}
                                                className={`sidebar-lesson-link ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}`}
                                            >
                                               <span className="lesson-link-icon">
                                                   {isCompleted ? <FaCheckCircle className="completed-icon"/> : (isUnlocked ? <div className="unlock-ring"></div> : <FaLock />)}
                                               </span>
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