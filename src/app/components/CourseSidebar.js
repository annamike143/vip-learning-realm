// --- src/app/components/CourseSidebar.js (v3.0 - MOBILE DROPDOWN) ---
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaLock, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { calculateCourseProgress, isLessonUnlocked, isLessonCompleted } from '../utils/progressUtils';
import './CourseSidebar.css';

const CourseSidebar = ({ course, userProgress, courseId, activeLessonId }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const sortedModules = course.modules ? Object.keys(course.modules).sort((a,b) => course.modules[a].order - course.modules[b].order) : [];
    
    // Calculate progress using standardized utility
    const progressStats = calculateCourseProgress(course, userProgress);
    const { totalLessons, completedLessons, progressPercentage } = progressStats;

    return (
        <aside className="course-sidebar">
            {/* Mobile Dropdown Button */}
            <button 
                className="mobile-course-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                📚 Course Lessons ({completedLessons}/{totalLessons})
                {mobileMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {/* Sidebar Content */}
            <div className={`sidebar-content ${mobileMenuOpen ? 'show' : ''}`}>
                <div className="sidebar-header">
                    <h3>{course.details.title}</h3>
                    {/* Progress Bar */}
                    <div className="sidebar-progress">
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <span>{completedLessons} of {totalLessons} lessons completed</span>
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
                                       const isUnlocked = isLessonUnlocked(lessonId, userProgress);
                                       const isCompleted = isLessonCompleted(lessonId, userProgress);
                                       const isActive = activeLessonId === lessonId;

                                       return (
                                           <li key={lessonId}>
                                               <Link 
                                                    href={isUnlocked ? `/course/${courseId}/${lessonId}` : '#'}
                                                    className={`sidebar-lesson-link ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active' : ''}`}
                                                    onClick={() => setMobileMenuOpen(false)} // Close menu on mobile when lesson is selected
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
            </div>
        </aside>
    );
};

export default CourseSidebar;