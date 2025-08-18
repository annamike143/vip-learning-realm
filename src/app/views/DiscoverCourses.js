// --- src/app/views/DiscoverCourses.js ---
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './DiscoverCourses.css'; // We will create this

const DiscoverCourses = ({ allCourses, enrolledCourseIds }) => {
    // --- THE NEW, INTELLIGENT DISCOVERY LOGIC ---
    const availableCourses = Object.keys(allCourses)
        .filter(courseId => !enrolledCourseIds.includes(courseId) && allCourses[courseId]?.details?.status === 'Published')
        .map(courseId => ({ id: courseId, ...allCourses[courseId].details }));

    const comingSoonCourses = Object.keys(allCourses)
        .filter(courseId => !enrolledCourseIds.includes(courseId) && allCourses[courseId]?.details?.status === 'Draft' && allCourses[courseId]?.details?.comingSoon === true)
        .map(courseId => ({ id: courseId, ...allCourses[courseId].details }));

    if (availableCourses.length === 0 && comingSoonCourses.length === 0) {
        return null;
    }

    return (
        <div className="discover-section">
            <div className="container">
                {availableCourses.length > 0 && (
                    <>
                        <h2>Discover New Courses</h2>
                        <p>Continue your growth and master new skills to elevate your business.</p>
                        <div className="courses-grid">
                            {availableCourses.map(course => (
                               <Link key={course.id} href={`/store/${course.id}`} className="course-card">
                                    <Image src={course.thumbnailUrl || '/default-thumbnail.jpg'} alt={course.title} fill style={{ objectFit: 'cover', zIndex: 1 }} className="card-background-image" />
                                    <div className="card-overlay"></div>
                                    <div className="course-card-content">
                                        <h3>{course.title}</h3>
                                        <span className="view-course-button">View Course</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {comingSoonCourses.length > 0 && (
                    <div className="coming-soon-section">
                        <h2>Coming Soon</h2>
                        <p>Get ready for the next evolution in your training.</p>
                        <div className="courses-grid">
                            {comingSoonCourses.map(course => (
                               <div key={course.id} className="course-card coming-soon">
                                    <Image src={course.thumbnailUrl || '/default-thumbnail.jpg'} alt={course.title} fill style={{ objectFit: 'cover', zIndex: 1 }} className="card-background-image" />
                                    <div className="card-overlay"></div>
                                    <div className="course-card-content">
                                        <h3>{course.title}</h3>
                                        <span className="view-course-button">Coming Soon</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscoverCourses;