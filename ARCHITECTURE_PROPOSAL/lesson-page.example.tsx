// src/app/course/[courseId]/lesson/[lessonId]/page.tsx
'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useLessonData } from '@/lib/hooks/useLessonData';
import { LessonProvider } from '@/components/lesson/LessonProvider';
import { LessonContent } from '@/components/lesson/LessonContent';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';
import { LessonSidebar } from '@/components/lesson/LessonSidebar';
import { ScrollLock } from '@/components/ui/ScrollLock';

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default function LessonPage({ params }: LessonPageProps) {
  const { lesson, course, loading, error } = useLessonData(
    params.courseId,
    params.lessonId
  );

  // Prevent any auto-scroll behavior
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Lock scroll position at top
    window.scrollTo(0, 0);
    
    return () => {
      // Re-enable scroll restoration on unmount
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [params.lessonId]); // Reset on lesson change

  if (loading) {
    return <LessonSkeleton />;
  }

  if (error || !lesson || !course) {
    notFound();
  }

  return (
    <LessonProvider lesson={lesson} course={course}>
      <ScrollLock enabled={true}>
        <div className="lesson-layout">
          {/* Fixed sidebar */}
          <LessonSidebar />
          
          {/* Main content area */}
          <main className="lesson-main">
            <LessonContent />
            <LessonNavigation />
          </main>
        </div>
      </ScrollLock>
    </LessonProvider>
  );
}
