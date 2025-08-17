// --- src/app/views/MyCourses.js ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';
import Link from 'next/link';
import './MyCourses.css';

const MyCourses = ({ user }) => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const coursesRef = ref(database, 'courses');
        const enrollmentsRef = ref(database, `users/${user.uid}/enrollments`);

        // Use Promise.all to wait for both data fetches to complete
        Promise.all([
            new Promise((resolve) => onValue(coursesRef, (snapshot) => resolve(snapshot.val() || {}), { onlyOnce: true })),
            new Promise((resolve) => onValue(enrollmentsRef, (snapshot) => resolve(snapshot.val() || {}), { onlyOnce: true }))
        ]).then(([allCourses, userEnrollments]) => {
            const myCourses = Object.keys(userEnrollments).map(courseId => {
                const courseDetails = allCourses[courseId]?.details;
                const courseModules = allCourses[courseId]?.modules;
                const enrollmentProgress = userEnrollments[courseId]?.progress;

                if (!courseDetails || !courseModules) return null;

                // Calculate progress
                const totalLessons = Object.values(courseModules).reduce((acc, module) => acc + (module.lessons ? Object.keys(module.lessons).length : 0), 0);
                const completedLessons = enrollmentProgress?.completedLessons ? Object.keys(enrollmentProgress.completedLessons).length : 0;
                const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

                return {
                    id: courseId,
                    ...courseDetails,
                    progress: progressPercentage,
                };
            }).filter(Boolean); // Filter out any null courses

            setEnrolledCourses(myCourses);
            setLoading(false);
        });

    }, [user]);

    if (loading) {
        return <div className="loading-state">Loading Your Courses...</div>;
    }

    return (
        <div className="my-courses-container">
            <h2>My Courses</h2>
            <p>Select a course to begin or continue your learning journey.</p>
            
            {enrolledCourses.length > 0 ? (
                <div className="courses-grid">
                    {enrolledCourses.map(course => (
                        <Link key={course.id} href={`/course/${course.id}`} className="course-card">
                            {/* Thumbnail will go here later */}
                            <div className="course-card-content">
                                <h3>{course.title}</h3>
                                <p>{course.description}</p>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                                </div>
                                <span className="progress-text">{Math.round(course.progress)}% Complete</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p>You are not yet enrolled in any courses.</p>
            )}
        </div>
    );
};

export default MyCourses;