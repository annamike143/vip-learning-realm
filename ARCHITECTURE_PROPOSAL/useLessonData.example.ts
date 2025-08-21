// src/lib/hooks/useLessonData.ts
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { useCourseStore } from '@/lib/stores/courseStore';

interface UseLessonDataReturn {
  lesson: Lesson | null;
  course: Course | null;
  loading: boolean;
  error: string | null;
}

export function useLessonData(courseId: string, lessonId: string): UseLessonDataReturn {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setCourse: setStoreCourse, setLesson: setStoreLesson } = useCourseStore();

  useEffect(() => {
    if (!courseId || !lessonId) {
      setError('Missing course or lesson ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // References for Firebase listeners
    const courseRef = ref(database, `courses/${courseId}`);
    const lessonRef = ref(database, `courses/${courseId}/lessons/${lessonId}`);

    // Course data listener
    const courseListener = onValue(courseRef, (snapshot) => {
      if (snapshot.exists()) {
        const courseData = snapshot.val();
        setCourse(courseData);
        setStoreCourse(courseData);
      } else {
        setError('Course not found');
      }
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    // Lesson data listener
    const lessonListener = onValue(lessonRef, (snapshot) => {
      if (snapshot.exists()) {
        const lessonData = snapshot.val();
        setLesson(lessonData);
        setStoreLesson(lessonData);
      } else {
        setError('Lesson not found');
      }
      setLoading(false);
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      off(courseRef, 'value', courseListener);
      off(lessonRef, 'value', lessonListener);
    };
  }, [courseId, lessonId, setStoreCourse, setStoreLesson]);

  return { lesson, course, loading, error };
}
