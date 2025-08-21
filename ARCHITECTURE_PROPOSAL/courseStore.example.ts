// src/lib/stores/courseStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CourseState {
  // Course data
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  userProgress: UserProgress | null;
  
  // UI state
  isLoading: boolean;
  sidebarOpen: boolean;
  
  // Actions
  setCourse: (course: Course) => void;
  setLesson: (lesson: Lesson) => void;
  setProgress: (progress: UserProgress) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

export const useCourseStore = create<CourseState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentCourse: null,
    currentLesson: null,
    userProgress: null,
    isLoading: false,
    sidebarOpen: false,
    
    // Actions
    setCourse: (course) => set({ currentCourse: course }),
    setLesson: (lesson) => set({ currentLesson: lesson }),
    setProgress: (progress) => set({ userProgress: progress }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    reset: () => set({
      currentCourse: null,
      currentLesson: null,
      userProgress: null,
      isLoading: false,
      sidebarOpen: false,
    }),
  }))
);
