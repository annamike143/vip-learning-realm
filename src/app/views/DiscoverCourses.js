// --- src/app/views/DiscoverCourses.js ---
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './DiscoverCourses.css'; // We will create this

const DiscoverCourses = ({ allCourses, enrolledCourseIds }) => {
    const unEnrolledCourses = Object.keys(allCourses)
        .filter(courseId => !enrolledCourseIds.includes(courseId))
        .map(courseId => ({ id: courseId, ...allCourses[courseId].details }));

    if (unEnrolledCourses.length === 0) {
        return null; // Don't show this section if they're enrolled in everything
    }

    return (
        <div className="discover-section">
            <div className="container">
                <h2>Discover New Courses</h2>
                <p>Continue your growth and master new skills to elevate your business.</p>
                <div className="courses-grid">
                    {unEnrolledCourses.map(course => (
                       <Link key={course.id} href={`/store/${course.id}`} className="course-card">
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
                                <span className="view-course-button">View Course</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiscoverCourses;