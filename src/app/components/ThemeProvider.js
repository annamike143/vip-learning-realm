// --- src/app/components/ThemeProvider.js (Dynamic Theming System) ---
'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../lib/firebase';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Predefined theme configurations with comprehensive color palettes
export const THEME_PRESETS = {
    classic: {
        name: 'Classic Red',
        primary: '#CC0000',
        primaryHover: '#a30000',
        primaryLight: '#ff4444',
        secondary: '#6b7280',
        tertiary: '#f3f4f6',
        accent: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#10b981',
        background: '#ffffff',
        surface: '#f8fafc',
        surfaceSecondary: '#f1f5f9',
        text: '#111827',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        border: '#e5e7eb',
        borderLight: '#f3f4f6',
        shadow: 'rgba(0, 0, 0, 0.1)',
        shadowDark: 'rgba(0, 0, 0, 0.2)',
        gradient: 'linear-gradient(135deg, #CC0000, #ff4444)',
        gradientSecondary: 'linear-gradient(135deg, #f8fafc, #e5e7eb)',
        logoBackground: 'linear-gradient(135deg, #CC0000, #ff4444)',
    },
    ocean: {
        name: 'Ocean Blue',
        primary: '#0ea5e9',
        primaryHover: '#0284c7',
        primaryLight: '#38bdf8',
        secondary: '#64748b',
        tertiary: '#f1f5f9',
        accent: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#22c55e',
        background: '#ffffff',
        surface: '#f0f9ff',
        surfaceSecondary: '#e0f2fe',
        text: '#0f172a',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        border: '#e2e8f0',
        borderLight: '#f1f5f9',
        shadow: 'rgba(14, 165, 233, 0.1)',
        shadowDark: 'rgba(14, 165, 233, 0.2)',
        gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
        gradientSecondary: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        logoBackground: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    },
    forest: {
        name: 'Forest Green',
        primary: '#059669',
        primaryHover: '#047857',
        primaryLight: '#10b981',
        secondary: '#6b7280',
        tertiary: '#f0fdf4',
        accent: '#f59e0b',
        warning: '#eab308',
        error: '#ef4444',
        success: '#22c55e',
        background: '#ffffff',
        surface: '#f0fdf4',
        surfaceSecondary: '#dcfce7',
        text: '#064e3b',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        border: '#d1fae5',
        borderLight: '#f0fdf4',
        shadow: 'rgba(5, 150, 105, 0.1)',
        shadowDark: 'rgba(5, 150, 105, 0.2)',
        gradient: 'linear-gradient(135deg, #059669, #10b981)',
        gradientSecondary: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        logoBackground: 'linear-gradient(135deg, #059669, #10b981)',
    },
    purple: {
        name: 'Royal Purple',
        primary: '#7c3aed',
        primaryHover: '#6d28d9',
        primaryLight: '#8b5cf6',
        secondary: '#6b7280',
        tertiary: '#faf5ff',
        accent: '#f59e0b',
        warning: '#eab308',
        error: '#ef4444',
        success: '#10b981',
        background: '#ffffff',
        surface: '#faf5ff',
        surfaceSecondary: '#f3e8ff',
        text: '#3730a3',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        border: '#e9d5ff',
        borderLight: '#faf5ff',
        shadow: 'rgba(124, 58, 237, 0.1)',
        shadowDark: 'rgba(124, 58, 237, 0.2)',
        gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
        gradientSecondary: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
        logoBackground: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    },
    sunset: {
        name: 'Sunset Orange',
        primary: '#ea580c',
        primaryHover: '#dc2626',
        primaryLight: '#f97316',
        secondary: '#6b7280',
        tertiary: '#fff7ed',
        accent: '#eab308',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#10b981',
        background: '#ffffff',
        surface: '#fff7ed',
        surfaceSecondary: '#ffedd5',
        text: '#9a3412',
        textSecondary: '#6b7280',
        textMuted: '#9ca3af',
        border: '#fed7aa',
        borderLight: '#fff7ed',
        shadow: 'rgba(234, 88, 12, 0.1)',
        shadowDark: 'rgba(234, 88, 12, 0.2)',
        gradient: 'linear-gradient(135deg, #ea580c, #f97316)',
        gradientSecondary: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
        logoBackground: 'linear-gradient(135deg, #ea580c, #f97316)',
    },
    dark: {
        name: 'Dark Mode',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: '#60a5fa',
        secondary: '#9ca3af',
        tertiary: '#374151',
        accent: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#22c55e',
        background: '#111827',
        surface: '#1f2937',
        surfaceSecondary: '#374151',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',
        border: '#374151',
        borderLight: '#4b5563',
        shadow: 'rgba(0, 0, 0, 0.3)',
        shadowDark: 'rgba(0, 0, 0, 0.5)',
        gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
        gradientSecondary: 'linear-gradient(135deg, #1f2937, #374151)',
        logoBackground: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    }
};

export default function ThemeProvider({ children, courseId }) {
    const [currentTheme, setCurrentTheme] = useState(THEME_PRESETS.classic);
    const [customBranding, setCustomBranding] = useState({
        logoText: 'MS',
        academyName: 'Mike Salazar Academy',
        logoUrl: null,
        instructorMessage: null,
        socialLinks: {},
    });

    useEffect(() => {
        if (!courseId) return;

        const themeRef = ref(database, `courses/${courseId}/theme`);
        const brandingRef = ref(database, `courses/${courseId}/branding`);

        const unsubTheme = onValue(themeRef, (snapshot) => {
            const themeData = snapshot.val();
            if (themeData) {
                if (themeData.preset && THEME_PRESETS[themeData.preset]) {
                    setCurrentTheme({
                        ...THEME_PRESETS[themeData.preset],
                        ...themeData.customColors // Allow custom color overrides
                    });
                } else if (themeData.customColors) {
                    setCurrentTheme({
                        ...THEME_PRESETS.classic,
                        ...themeData.customColors
                    });
                }
            }
        });

        const unsubBranding = onValue(brandingRef, (snapshot) => {
            const brandingData = snapshot.val();
            if (brandingData) {
                setCustomBranding(prev => ({
                    ...prev,
                    ...brandingData
                }));
            }
        });

        return () => {
            unsubTheme();
            unsubBranding();
        };
    }, [courseId]);

    // Apply theme to CSS custom properties
    useEffect(() => {
        const root = document.documentElement;
        
        // Map theme properties to CSS custom properties used throughout the app
        const cssVariableMap = {
            primary: '--primary-red',
            primaryHover: '--primary-red-hover',
            background: '--background-color',
            surface: '--surface-color',
            text: '--text-primary',
            textSecondary: '--text-secondary',
            border: '--border-color',
        };
        
        console.log('🎨 Applying theme:', currentTheme.name, currentTheme);
        
        // Apply mapped variables
        Object.entries(cssVariableMap).forEach(([themeKey, cssVar]) => {
            if (currentTheme[themeKey]) {
                root.style.setProperty(cssVar, currentTheme[themeKey]);
                console.log(`Set ${cssVar} = ${currentTheme[themeKey]}`);
            }
        });
        
        // Also apply with theme prefix for components that use them
        Object.entries(currentTheme).forEach(([key, value]) => {
            if (typeof value === 'string') {
                root.style.setProperty(`--theme-${key}`, value);
            }
        });
    }, [currentTheme]);

    const value = {
        currentTheme,
        customBranding,
        themePresets: THEME_PRESETS,
        setTheme: (preset) => {
            if (THEME_PRESETS[preset]) {
                setCurrentTheme(THEME_PRESETS[preset]);
            }
        },
        updateCustomColors: (colors) => {
            setCurrentTheme(prev => ({ ...prev, ...colors }));
        },
        updateBranding: (branding) => {
            setCustomBranding(prev => ({ ...prev, ...branding }));
        }
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
