// NUCLEAR TEST VERSION - Minimal lesson page to isolate scroll issue
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function NuclearTestPage({ params }) {
    const { courseId, lessonId } = params;
    const { user, loading: authLoading } = useAuth();

    // NUCLEAR APPROACH: Lock scroll position completely
    useEffect(() => {
        console.log('🔒 APPLYING NUCLEAR SCROLL LOCK');
        
        // Disable browser scroll restoration
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        
        // Force scroll to top and lock it there
        window.scrollTo(0, 0);
        
        // Prevent ALL scrolling attempts
        const preventScroll = (e) => {
            console.log('🔒 BLOCKED scroll attempt');
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo(0, 0);
            return false;
        };
        
        // Override ALL scroll methods
        const originalScrollTo = window.scrollTo;
        const originalScrollBy = window.scrollBy;
        const originalScrollIntoView = Element.prototype.scrollIntoView;
        
        window.scrollTo = function(...args) {
            console.log('🔒 BLOCKED scrollTo attempt:', args);
            return false;
        };
        
        window.scrollBy = function(...args) {
            console.log('🔒 BLOCKED scrollBy attempt:', args);
            return false;
        };
        
        Element.prototype.scrollIntoView = function(...args) {
            console.log('🔒 BLOCKED scrollIntoView attempt:', this, args);
            return false;
        };
        
        // Block all scroll events
        window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        
        // Force scroll position check
        const forceTop = setInterval(() => {
            if (window.scrollY !== 0) {
                console.log('🔒 FORCING scroll back to top from:', window.scrollY);
                window.scrollY = 0;
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }
        }, 10);
        
        return () => {
            console.log('🔒 Cleaning up nuclear scroll lock');
            window.removeEventListener('scroll', preventScroll, { capture: true });
            document.removeEventListener('scroll', preventScroll, { capture: true });
            window.scrollTo = originalScrollTo;
            window.scrollBy = originalScrollBy;
            Element.prototype.scrollIntoView = originalScrollIntoView;
            clearInterval(forceTop);
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
        };
    }, []);

    if (authLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>
            <h1>🔒 NUCLEAR SCROLL TEST</h1>
            <p><strong>Course ID:</strong> {courseId}</p>
            <p><strong>Lesson ID:</strong> {lessonId}</p>
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            
            <div style={{ 
                height: '2000px', 
                background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)', 
                padding: '2rem',
                border: '2px solid red'
            }}>
                <h2>🎯 SCROLL TEST AREA</h2>
                <p>This page should NOT scroll automatically</p>
                <p>Check console for scroll lock messages</p>
                
                <div style={{ marginTop: '800px' }}>
                    <h2>🎯 TARGET AREA (where auto-scroll usually goes)</h2>
                    <p style={{ fontSize: '24px', color: 'red' }}>
                        If you see this text WITHOUT scrolling manually, the nuclear scroll lock failed!
                    </p>
                </div>
                
                <div style={{ marginTop: '800px' }}>
                    <h2>Bottom Area</h2>
                    <p>This represents the unlock section area</p>
                </div>
            </div>
        </div>
    );
}
