// --- Dynamic Sitemap Generation ---
import { ref, get } from 'firebase/database';
import { database } from './lib/firebase';

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://learning.mikesalazaracademy.com';
    
    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        }
    ];

    try {
        // Get dynamic course and lesson pages
        const coursesRef = ref(database, 'courses');
        const coursesSnapshot = await get(coursesRef);
        const dynamicPages = [];

        if (coursesSnapshot.exists()) {
            const courses = coursesSnapshot.val();
            
            Object.entries(courses).forEach(([courseId, courseData]) => {
                // Add course page
                dynamicPages.push({
                    url: `${baseUrl}/course/${courseId}`,
                    lastModified: courseData.lastModified ? new Date(courseData.lastModified) : new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });

                // Add lesson pages
                if (courseData.modules) {
                    Object.entries(courseData.modules).forEach(([moduleId, moduleData]) => {
                        if (moduleData.lessons) {
                            Object.entries(moduleData.lessons).forEach(([lessonId, lessonData]) => {
                                // Only include lessons that are not restricted
                                if (!lessonData.isRestricted || lessonData.isPublic) {
                                    dynamicPages.push({
                                        url: `${baseUrl}/course/${courseId}/${lessonId}`,
                                        lastModified: lessonData.lastModified ? new Date(lessonData.lastModified) : new Date(),
                                        changeFrequency: 'weekly',
                                        priority: 0.7,
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        return [...staticPages, ...dynamicPages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return static pages only if dynamic generation fails
        return staticPages;
    }
}
