// --- src/app/views/MyCourses.js (v2.0 - The "Success Hub") ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import Link from 'next/link';
import Image from 'next/image'; // For optimized background images
import './MyCourses.css';

// ✅ New imports for DiscoverCourses
import DiscoverCourses from './DiscoverCourses';
import './DiscoverCourses.css';

const MyCourses = ({ user }) => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [allCourses, setAllCourses] = useState({}); // ✅ New state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const coursesRef = ref(database, 'courses');
        const enrollmentsRef = ref(database, `users/${user.uid}/enrollments`);

        Promise.all([
            new Promise((resolve) =>
                onValue(coursesRef, (snapshot) => resolve(snapshot.val() || {}), { onlyOnce: true })
            ),
            new Promise((resolve) =>
                onValue(enrollmentsRef, (snapshot) => resolve(snapshot.val() || {}), { onlyOnce: true })
            )
        ]).then(([allCoursesData, userEnrollments]) => {
            setAllCourses(allCoursesData); // ✅ Store all courses

            const myCourses = Object.keys(userEnrollments).map(courseId => {
                const courseDetails = allCoursesData[courseId]?.details;
                const courseModules = allCoursesData[courseId]?.modules;
                const enrollmentProgress = userEnrollments[courseId]?.progress;

                if (!courseDetails || !courseModules) return null;

                const totalLessons = Object.values(courseModules).reduce((acc, module) => {
                    return acc + (module.lessons ? Object.keys(module.lessons).length : 0);
                }, 0);

                const completedLessons = enrollmentProgress?.completedLessons
                    ? Object.keys(enrollmentProgress.completedLessons).length
                    : 0;

                const progressPercentage = totalLessons > 0
                    ? (completedLessons / totalLessons) * 100
                    : 0;

                const currentLessonId = enrollmentProgress?.currentLessonId || 'lesson_01';

                return {
                    id: courseId,
                    ...courseDetails,
                    progress: progressPercentage,
                    currentLessonId: currentLessonId,
                };
            }).filter(Boolean);

            setEnrolledCourses(myCourses);
            setLoading(false);
        });
    }, [user]);

    if (loading) {
        return <div className="loading-state">Loading Your Courses...</div>;
    }

    return (
        <div className="my-courses-shell">
            <div className="breathing-background"></div>
            <div className="my-courses-container">
                <h2>My Courses</h2>
                <p>Select a course to begin or continue your learning journey.</p>

                {enrolledCourses.length > 0 ? (
                    <div className="courses-grid">
                        {enrolledCourses.map(course => (
                            <Link
                                key={course.id}
                                href={`/course/${course.id}/${course.currentLessonId}`}
                                className="course-card"
                            >
                                <Image
                                    src={course.thumbnailUrl || '/default-thumbnail.jpg'}
                                    alt={course.title}
                                    fill
                                    style={{ objectFit: 'cover', zIndex: 1 }}
                                    className="card-background-image"
                                />
                                <div className="card-overlay"></div>
                                <div className="course-card-content">
                                    <h3>{course.title}</h3>
                                    <div className="progress-container">
                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${course.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">
                                            {Math.round(course.progress)}% Complete
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="no-courses-message">
                        <p>You are not yet enrolled in any courses.</p>
                        {/* The "Discover" button will go here */}
                    </div>
                )}
            </div>

            {/* ✅ DiscoverCourses component added here */}
            <DiscoverCourses
                allCourses={allCourses}
                enrolledCourseIds={enrolledCourses.map(c => c.id)}
            />
        </div>
    );
};

export default MyCourses;