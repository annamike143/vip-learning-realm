// --- src/app/components/LessonNavigation.js (Smart Navigation System) ---
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaLock } from 'react-icons/fa';
import { getAllLessonsInOrder, isLessonUnlocked, getNavigationLessons } from '../utils/progressUtils';
import './LessonNavigation.css';

const LessonNavigation = ({ 
    courseData, 
    userProgress, 
    courseId, 
    currentLessonId, 
    onScrollToUnlock,
    onNavigateToNext // New prop for handling navigation after unlock
}) => {
    const router = useRouter();

    // Use utility functions for navigation
    const navigationData = getNavigationLessons(currentLessonId, courseData);
    const { previousLesson, nextLesson, currentIndex, totalLessons } = navigationData;

    // Check if lesson is unlocked using utility
    const isUnlocked = (lessonId) => isLessonUnlocked(lessonId, userProgress);

    // Handle Previous Button Click
    const handlePrevious = () => {
        if (previousLesson && isUnlocked(previousLesson.lessonId)) {
            router.push(`/course/${courseId}/${previousLesson.lessonId}`);
        }
    };

    // Handle Next Button Click - Clean Logic
    const handleNext = () => {
        if (!nextLesson) return;
        
        if (isUnlocked(nextLesson.lessonId)) {
            // Next lesson is unlocked, navigate directly
            router.push(`/course/${courseId}/${nextLesson.lessonId}`);
        } else {
            // Next lesson is locked, execute unlock workflow
            if (onScrollToUnlock) {
                // Scroll to unlock section
                onScrollToUnlock();
                
                // Provide navigation callback for after unlock
                if (onNavigateToNext) {
                    onNavigateToNext(nextLesson.lessonId);
                }
            }
        }
    };

    // Don't render if no navigation data
    if (!courseData || totalLessons === 0) return null;

    return (
        <div className="lesson-navigation">
            <div className="nav-container">
                {/* Previous Button */}
                <button 
                    className={`nav-btn prev-btn ${!previousLesson || !isUnlocked(previousLesson?.lessonId) ? 'disabled' : ''}`}
                    onClick={handlePrevious}
                    disabled={!previousLesson || !isUnlocked(previousLesson?.lessonId)}
                    title={previousLesson ? `Previous: ${previousLesson.lesson.title}` : 'No previous lesson'}
                >
                    <FaChevronLeft className="nav-icon" />
                    <div className="nav-text">
                        <span className="nav-label">Previous</span>
                        {previousLesson && (
                            <span className="nav-title">{previousLesson.lesson.title}</span>
                        )}
                    </div>
                </button>

                {/* Lesson Counter */}
                <div className="lesson-counter">
                    <span className="current-position">{currentIndex + 1}</span>
                    <span className="divider">of</span>
                    <span className="total-lessons">{totalLessons}</span>
                </div>

                {/* Next Button */}
                <button 
                    className={`nav-btn next-btn ${!nextLesson ? 'disabled' : isUnlocked(nextLesson?.lessonId) ? 'unlocked' : 'locked'}`}
                    onClick={handleNext}
                    disabled={!nextLesson}
                    title={
                        !nextLesson 
                            ? 'No next lesson' 
                            : isUnlocked(nextLesson.lessonId)
                                ? `Next: ${nextLesson.lesson.title}`
                                : `Unlock required: ${nextLesson.lesson.title}`
                    }
                >
                    <div className="nav-text">
                        <span className="nav-label">
                            {nextLesson && !isUnlocked(nextLesson.lessonId) ? 'Unlock Next' : 'Next'}
                        </span>
                        {nextLesson && (
                            <span className="nav-title">{nextLesson.lesson.title}</span>
                        )}
                    </div>
                    {nextLesson && !isUnlocked(nextLesson.lessonId) ? (
                        <FaLock className="nav-icon lock-icon" />
                    ) : (
                        <FaChevronRight className="nav-icon" />
                    )}
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="nav-progress">
                <div className="progress-track">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${((currentIndex + 1) / totalLessons) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default LessonNavigation;
