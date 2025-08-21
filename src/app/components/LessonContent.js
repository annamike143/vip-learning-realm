// --- src/app/components/LessonContent.js (Kajabi-Style Lesson Layout) ---
'use client';
import React from 'react';
import { calculateCourseProgress } from '../utils/progressUtils';
import './LessonContent.css';

export default function LessonContent({ lesson, courseData, moduleData, userProgress }) {
    if (!lesson) {
        return (
            <div className="lesson-loading">
                <div className="loading-spinner"></div>
                <p>Loading lesson content...</p>
            </div>
        );
    }

    return (
        <div className="kajabi-lesson-container">
            {/* Lesson Header with Breadcrumb */}
            <div className="lesson-header">
                <nav className="lesson-breadcrumb">
                    <span className="breadcrumb-item">{courseData?.details?.title}</span>
                    <span className="breadcrumb-separator">→</span>
                    <span className="breadcrumb-item">{moduleData?.title}</span>
                    <span className="breadcrumb-separator">→</span>
                    <span className="breadcrumb-current">{lesson.title}</span>
                </nav>
                
                <div className="lesson-title-section">
                    <h1 className="lesson-title">{lesson.title}</h1>
                    {lesson.description && (
                        <p className="lesson-description">{lesson.description}</p>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lesson-main-content">
                {/* Video Player Section */}
                {(lesson.videoUrl || lesson.videoEmbedCode) && (
                    <div className="video-section">
                        <div className="video-container">
                            {lesson.videoEmbedCode ? (
                                <div 
                                    className="video-embed"
                                    dangerouslySetInnerHTML={{ __html: lesson.videoEmbedCode }}
                                />
                            ) : lesson.videoUrl ? (
                                lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                                    <iframe
                                        src={`${lesson.videoUrl.replace('watch?v=', 'embed/')}?modestbranding=1&rel=0&showinfo=0&controls=1`}
                                        title={lesson.title}
                                        className="video-player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : lesson.videoUrl.includes('vimeo.com') ? (
                                    <iframe
                                        src={lesson.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                        title={lesson.title}
                                        className="video-player"
                                        frameBorder="0"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <video
                                        src={lesson.videoUrl}
                                        className="video-player"
                                        controls
                                        preload="metadata"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                )
                            ) : (
                                <div className="video-placeholder">
                                    <div className="placeholder-content">
                                        <div className="placeholder-icon">🎥</div>
                                        <h3>Video Content</h3>
                                        <p>Video will be available here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Lesson Content */}
                <div className="lesson-content-section">
                    {lesson.content && (
                        <div className="lesson-text-content">
                            <div className="content-wrapper">
                                {lesson.content.split('\n').map((paragraph, index) => (
                                    paragraph.trim() && (
                                        <p key={index} className="content-paragraph">
                                            {paragraph}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Resources */}
                    {lesson.resources && lesson.resources.length > 0 && (
                        <div className="lesson-resources">
                            <h3 className="resources-title">Additional Resources</h3>
                            <div className="resources-grid">
                                {lesson.resources.map((resource, index) => (
                                    <a 
                                        key={index}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="resource-card"
                                    >
                                        <div className="resource-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                                            </svg>
                                        </div>
                                        <div className="resource-content">
                                            <h4 className="resource-title">{resource.title}</h4>
                                            <p className="resource-description">{resource.description}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Course Progress Indicator */}
                {courseData && userProgress && (
                    <div className="course-progress-section">
                        <div className="progress-header">
                            <span className="progress-label">Course Progress</span>
                            <span className="progress-stats">
                                {(() => {
                                    const stats = calculateCourseProgress(courseData, userProgress);
                                    return `${stats.completedLessons} of ${stats.totalLessons} lessons completed`;
                                })()}
                            </span>
                        </div>
                        <div className="course-progress-bar">
                            <div 
                                className="course-progress-fill" 
                                style={{ 
                                    width: `${calculateCourseProgress(courseData, userProgress).completionPercentage}%` 
                                }}
                            ></div>
                        </div>
                        <div className="progress-percentage">
                            {calculateCourseProgress(courseData, userProgress).completionPercentage}% Complete
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
