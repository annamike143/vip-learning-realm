// --- src/app/utils/progressUtils.js (Standardized Progress Calculations) ---

/**
 * Standardized progress calculation utilities
 * Ensures consistent data structure across all components
 */

/**
 * Calculate progress statistics for a course
 * @param {Object} courseData - Course data with modules and lessons
 * @param {Object} userProgress - User progress data with completedLessons and unlockedLessons
 * @returns {Object} Progress statistics
 */
export const calculateCourseProgress = (courseData, userProgress) => {
    if (!courseData?.modules || !userProgress) {
        return {
            totalLessons: 0,
            completedLessons: 0,
            unlockedLessons: 0,
            progressPercentage: 0,
            completionPercentage: 0
        };
    }

    let totalLessons = 0;
    let completedCount = 0;
    let unlockedCount = 0;

    // Count lessons across all modules
    Object.values(courseData.modules).forEach(module => {
        if (module.lessons) {
            const lessonIds = Object.keys(module.lessons);
            totalLessons += lessonIds.length;

            lessonIds.forEach(lessonId => {
                if (userProgress.completedLessons?.[lessonId]) {
                    completedCount++;
                }
                if (userProgress.unlockedLessons?.[lessonId]) {
                    unlockedCount++;
                }
            });
        }
    });

    const progressPercentage = totalLessons > 0 ? Math.round((unlockedCount / totalLessons) * 100) : 0;
    const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
        totalLessons,
        completedLessons: completedCount,
        unlockedLessons: unlockedCount,
        progressPercentage, // Based on unlocked lessons
        completionPercentage // Based on completed lessons
    };
};

/**
 * Get all lessons in order from course data
 * @param {Object} courseData - Course data with modules and lessons
 * @returns {Array} Array of lesson objects with metadata
 */
export const getAllLessonsInOrder = (courseData) => {
    if (!courseData?.modules) return [];
    
    const allLessons = [];
    const sortedModules = Object.keys(courseData.modules)
        .sort((a, b) => courseData.modules[a].order - courseData.modules[b].order);
    
    sortedModules.forEach(moduleId => {
        const module = courseData.modules[moduleId];
        if (module.lessons) {
            const sortedLessons = Object.keys(module.lessons)
                .sort((a, b) => module.lessons[a].order - module.lessons[b].order);
            
            sortedLessons.forEach(lessonId => {
                allLessons.push({
                    lessonId,
                    moduleId,
                    lesson: module.lessons[lessonId],
                    module: module
                });
            });
        }
    });
    
    return allLessons;
};

/**
 * Check if a lesson is unlocked
 * @param {string} lessonId - Lesson ID to check
 * @param {Object} userProgress - User progress data
 * @returns {boolean} Whether the lesson is unlocked
 */
export const isLessonUnlocked = (lessonId, userProgress) => {
    return userProgress?.unlockedLessons?.[lessonId] || false;
};

/**
 * Check if a lesson is completed
 * @param {string} lessonId - Lesson ID to check  
 * @param {Object} userProgress - User progress data
 * @returns {boolean} Whether the lesson is completed
 */
export const isLessonCompleted = (lessonId, userProgress) => {
    return userProgress?.completedLessons?.[lessonId] || false;
};

/**
 * Get next and previous lessons for navigation
 * @param {string} currentLessonId - Current lesson ID
 * @param {Object} courseData - Course data
 * @returns {Object} Object with nextLesson and previousLesson
 */
export const getNavigationLessons = (currentLessonId, courseData) => {
    const allLessons = getAllLessonsInOrder(courseData);
    const currentIndex = allLessons.findIndex(l => l.lessonId === currentLessonId);
    
    return {
        previousLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
        nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
        currentIndex,
        totalLessons: allLessons.length
    };
};

/**
 * Update user progress with new lesson completion or unlock
 * @param {Object} currentProgress - Current user progress
 * @param {string} lessonId - Lesson ID to update
 * @param {string} type - 'unlock' or 'complete'
 * @returns {Object} Updated progress object
 */
export const updateUserProgress = (currentProgress, lessonId, type) => {
    const updatedProgress = {
        completedLessons: { ...currentProgress?.completedLessons },
        unlockedLessons: { ...currentProgress?.unlockedLessons }
    };

    if (type === 'unlock') {
        updatedProgress.unlockedLessons[lessonId] = true;
    } else if (type === 'complete') {
        updatedProgress.completedLessons[lessonId] = true;
        // Also unlock if not already unlocked
        if (!updatedProgress.unlockedLessons[lessonId]) {
            updatedProgress.unlockedLessons[lessonId] = true;
        }
    }

    return updatedProgress;
};
