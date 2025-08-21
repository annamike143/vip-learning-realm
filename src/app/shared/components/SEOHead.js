// --- Professional SEO Head Component ---
'use client';

import { useEffect } from 'react';

const SEOHead = ({
    title = "The Mike Salazar Academy | VIP Learning Portal",
    description = "Exclusive premium educational platform featuring AI-powered learning, personalized instruction, and advanced course progression for VIP members.",
    keywords = "VIP education, premium learning, AI tutoring, Mike Salazar Academy, personalized instruction, online courses, exclusive training",
    canonical = null,
    ogImage = "/og-image.jpg",
    ogType = "website",
    twitterCard = "summary_large_image",
    twitterSite = "@MikeSalazarAcad",
    structuredData = null,
    noIndex = false,
    noFollow = false
}) => {
    // Clean and format title
    const cleanTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
    const fullTitle = title.includes("Mike Salazar Academy") ? title : `${title} | The Mike Salazar Academy`;
    
    // Clean and format description
    const cleanDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;
    
    // Generate canonical URL
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');
    
    // Build robots content
    const robotsContent = `${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'}`;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // Update document title
        document.title = fullTitle;
        
        // Update meta tags
        const updateMetaTag = (name, content, property = false) => {
            if (!content) return;
            const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let meta = document.querySelector(selector);
            if (!meta) {
                meta = document.createElement('meta');
                if (property) {
                    meta.setAttribute('property', name);
                } else {
                    meta.setAttribute('name', name);
                }
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };
        
        // Update basic meta tags
        updateMetaTag('description', cleanDescription);
        updateMetaTag('keywords', keywords);
        updateMetaTag('robots', robotsContent);
        updateMetaTag('author', 'The Mike Salazar Academy');
        
        // Update Open Graph tags
        updateMetaTag('og:title', cleanTitle, true);
        updateMetaTag('og:description', cleanDescription, true);
        updateMetaTag('og:type', ogType, true);
        updateMetaTag('og:image', ogImage, true);
        updateMetaTag('og:url', canonicalUrl, true);
        
        // Update Twitter tags
        updateMetaTag('twitter:title', cleanTitle, true);
        updateMetaTag('twitter:description', cleanDescription, true);
        updateMetaTag('twitter:image', ogImage, true);
        updateMetaTag('twitter:card', twitterCard, true);
        
        // Update canonical link
        if (canonicalUrl) {
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', canonicalUrl);
        }
        
        // Add structured data
        if (structuredData) {
            let script = document.querySelector('script[type="application/ld+json"]');
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('type', 'application/ld+json');
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }
        
    }, [fullTitle, cleanDescription, keywords, robotsContent, ogType, ogImage, canonicalUrl, twitterCard, structuredData]);

    return null; // This component only manages document head
};

// Pre-built SEO configurations for common pages
export const seoConfigs = {
    home: {
        title: "VIP Learning Portal | The Mike Salazar Academy",
        description: "Access exclusive premium courses with AI-powered learning, personalized instruction, and advanced progress tracking. Join the VIP learning experience.",
        keywords: "VIP learning, premium education, AI tutoring, exclusive courses, Mike Salazar Academy, personalized learning",
        ogType: "website"
    },
    
    course: (courseTitle) => ({
        title: `${courseTitle} | VIP Course`,
        description: `Master ${courseTitle} with our premium VIP course featuring AI-powered assistance, personalized feedback, and expert instruction.`,
        keywords: `${courseTitle}, VIP course, premium training, AI assistance, online learning`,
        ogType: "article"
    }),
    
    lesson: (lessonTitle, courseTitle) => ({
        title: `${lessonTitle} | ${courseTitle}`,
        description: `Learn ${lessonTitle} in our comprehensive ${courseTitle} course with AI-powered explanations and personalized guidance.`,
        keywords: `${lessonTitle}, ${courseTitle}, lesson, tutorial, AI learning`,
        ogType: "article"
    }),
    
    profile: {
        title: "My Learning Dashboard | VIP Portal",
        description: "Track your progress, access exclusive courses, and manage your VIP learning experience with advanced analytics and AI assistance.",
        keywords: "learning dashboard, progress tracking, VIP profile, course management",
        ogType: "profile",
        noIndex: true // Private user content
    },
    
    login: {
        title: "VIP Member Login | The Mike Salazar Academy",
        description: "Access your exclusive VIP learning portal with premium courses, AI tutoring, and personalized educational experiences.",
        keywords: "VIP login, member access, premium learning, exclusive courses",
        ogType: "website"
    }
};

// Helper function to generate course structured data
export const generateCourseStructuredData = (course) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
        "@type": "Organization",
        "name": "The Mike Salazar Academy",
        "url": "https://mikesalazaracademy.com"
    },
    "educationalLevel": "Professional",
    "courseMode": "online",
    "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
        "instructor": {
            "@type": "Person",
            "name": "Mike Salazar"
        }
    },
    "offers": {
        "@type": "Offer",
        "category": "VIP Membership",
        "availability": "https://schema.org/InStock"
    }
});

// Helper function to generate lesson structured data
export const generateLessonStructuredData = (lesson, course) => ({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": lesson.title,
    "description": lesson.description,
    "educationalLevel": "Professional",
    "learningResourceType": "Lesson",
    "isPartOf": {
        "@type": "Course",
        "name": course.title
    },
    "provider": {
        "@type": "Organization",
        "name": "The Mike Salazar Academy",
        "url": "https://mikesalazaracademy.com"
    },
    "author": {
        "@type": "Person",
        "name": "Mike Salazar"
    }
});

// Helper function to generate organization structured data
export const generateOrganizationStructuredData = () => ({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "The Mike Salazar Academy",
    "url": "https://mikesalazaracademy.com",
    "logo": "https://mikesalazaracademy.com/logo.png",
    "sameAs": [
        "https://twitter.com/MikeSalazarAcad",
        "https://linkedin.com/company/mike-salazar-academy"
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@mikesalazaracademy.com"
    },
    "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
    }
});

export default SEOHead;
