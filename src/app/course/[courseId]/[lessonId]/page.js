// --- src/app/course/[courseId]/[lessonId]/page.js (v4.0 - THE FINAL ASSEMBLY) ---
'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../hooks/useAuth';
import { database, functions } from '../../../lib/firebase';

// Import our master components
import InteractiveTabs from '../../../components/InteractiveTabs';
import RecitationTab from '../../../components/RecitationTab';
import QnaTab from '../../../components/QnaTab';
import ResourcesTab from '../../../components/ResourcesTab';

// Import the necessary stylesheets
import './lesson-page.css';
import '../../../components/InteractiveTabs.css';
import '../../../components/ResourcesTab.css'; // We need this now

export default function CourseLessonPage({ params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();
    const [lessonData, setLessonData] = useState(null);
    const [courseData, setCourseData] = useState(null); // We need course data for the Q&A AI ID
    const [loading, setLoading] = useState(true);
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockStatus, setUnlockStatus] = useState({ message: '', error: false });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lessonId || !courseId) return;
        const courseRef = ref(database, `courses/${courseId}`);
        
        const unsubscribe = onValue(courseRef, (snapshot) => {
            const courseSnapshot = snapshot.val();
            setCourseData(courseSnapshot);
            let foundLesson = null;
            if (courseSnapshot?.modules) {
                for (const modId in courseSnapshot.modules) {
                    if (courseSnapshot.modules[modId]?.lessons?.[lessonId]) {
                        foundLesson = courseSnapshot.modules[modId].lessons[lessonId];
                        break;
                    }
                }
            }
            if (foundLesson) setLessonData(foundLesson); else setError('Lesson content not found.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [courseId, lessonId]);

    const handleUnlock = async () => {
        if (!user) return alert("You must be logged in.");
        if (!unlockCode.trim()) return setUnlockStatus({ message: 'Please enter a code.', error: true });
        setUnlockStatus({ message: 'Verifying code...', error: false });
        const unlockNextLesson = httpsCallable(functions, 'unlockNextLesson');
        try {
            const result = await unlockNextLesson({ courseId, currentLessonId: lessonId, unlockCode });
            setUnlockStatus({ message: result.data.message, error: false });
            if (result.data.nextLessonId) {
                setTimeout(() => { window.location.href = `/course/${courseId}/${result.data.nextLessonId}`; }, 2000);
            }
        } catch (error) {
            setUnlockStatus({ message: error.message, error: true });
        }
    };

    if (authLoading || loading) return <div className="loading-state">Loading Your Lesson...</div>;
    if (error || !lessonData || !courseData) return <div className="loading-state">{error || 'An error occurred.'}</div>;

    // --- HERE IS THE MASTER ASSEMBLY ---
    const tabs = [
        {
            label: 'Lesson Recitation & Unlock',
            shouldRender: true,
            content: <RecitationTab 
                        lessonData={lessonData} 
                        unlockCode={unlockCode}
                        setUnlockCode={setUnlockCode}
                        handleUnlock={handleUnlock}
                        unlockStatus={unlockStatus}
                     />
        },
        {
            label: 'Course Q&A / Mentorship',
            shouldRender: true,
            content: <QnaTab courseData={courseData} user={user} />
        },
        {
            label: 'Downloads & Resources',
            shouldRender: lessonData.resources && Object.keys(lessonData.resources).length > 0,
            content: <ResourcesTab lessonData={lessonData} />
        }
    ];

    return (
        <div className="lesson-content-wrapper">
            <h2>{lessonData.title}</h2>
            <p>{lessonData.description}</p>
            <div className="video-container" dangerouslySetInnerHTML={{ __html: lessonData.videoEmbedCode || '' }} />

            <div className="interactive-zone">
                <InteractiveTabs tabs={tabs} />
            </div>
        </div>
    );
}