// --- src/app/components/KajabiHeader.js (Kajabi-Style Mobile-First Header) ---
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from "firebase/auth";
import { auth } from '../lib/firebase';
import { useTheme } from './ThemeProvider';
import { calculateCourseProgress } from '../utils/progressUtils';
import './KajabiHeader.css';

export default function KajabiHeader({ user, courseData, userProgress, currentPath }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { currentTheme, customBranding } = useTheme();

    const handleSignOut = () => {
        signOut(auth);
        setIsProfileDropdownOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

    // Calculate overall progress percentage using standardized utility
    const progressStats = calculateCourseProgress(courseData, userProgress);
    const progressPercentage = progressStats.completionPercentage;

    return (
        <header className="kajabi-header">
            <div className="kajabi-header-container">
                {/* Left: Logo Only */}
                <div className="kajabi-header-left">
                    <Link href="/" className="kajabi-logo">
                        {customBranding.logoUrl ? (
                            <img 
                                src={customBranding.logoUrl} 
                                alt={customBranding.academyName}
                                className="logo-image"
                            />
                        ) : (
                            <div 
                                className="logo-icon"
                                style={{ background: currentTheme.logoBackground }}
                            >
                                {customBranding.logoText || customBranding.academyName?.charAt(0) || 'V'}
                            </div>
                        )}
                    </Link>
                </div>

                {/* Center: Welcome Message */}
                <div className="kajabi-header-center">
                    <div className="welcome-message">
                        Welcome, {user?.displayName?.split(' ')[0] || 'VIP Member'}
                    </div>
                    {courseData && (
                        <div className="course-progress-compact">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            <span className="progress-text">{progressPercentage}%</span>
                        </div>
                    )}
                </div>

                {/* Right: User Menu */}
                <div className="kajabi-header-right">
                    {/* Mobile Menu Button */}
                    <button 
                        className="mobile-menu-button"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}></span>
                    </button>

                    {/* Desktop User Menu */}
                    <div className="desktop-user-menu">
                        <div className="user-profile-dropdown">
                            <button 
                                className="profile-button"
                                onClick={toggleProfileDropdown}
                            >
                                <div className="user-avatar">
                                    {(user?.displayName || 'V')[0].toUpperCase()}
                                </div>
                                <span className="user-name">
                                    {user?.displayName || 'VIP Member'}
                                </span>
                                <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8">
                                    <path d="M6 8L0 0h12L6 8z" fill="currentColor"/>
                                </svg>
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="profile-dropdown-menu">
                                    <Link href="/" className="dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                        </svg>
                                        My Courses
                                    </Link>
                                    <Link href="/profile" className="dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        Profile Settings
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item signout-item" onClick={handleSignOut}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z"/>
                                            <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`mobile-nav-menu ${isMenuOpen ? 'active' : ''}`}>
                <div className="mobile-nav-content">
                    {/* Mobile Progress */}
                    {courseData && (
                        <div className="mobile-progress-section">
                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">{progressPercentage}% Complete</span>
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Items */}
                    <nav className="mobile-nav-links">
                        <Link href="/" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                            </svg>
                            My Courses
                        </Link>
                        <Link href="/profile" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            Profile Settings
                        </Link>
                        <button className="mobile-nav-item signout-item" onClick={handleSignOut}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z"/>
                                <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                            </svg>
                            Sign Out
                        </button>
                    </nav>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
            )}
        </header>
    );
}
