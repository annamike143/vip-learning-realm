// --- src/app/page.js (v2.1 - With True VIP Dashboard) ---
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './lib/firebase';
import Login from './components/Login';
import MyCourses from './views/MyCourses'; // Our new dashboard
import { goToCommandCenter } from './shared/navigation/cross-system';
import { canAccessCommandCenter, detectRoleFromEmail } from './shared/auth/roleUtils';
import { initializeAnalytics, trackPageView, trackUserInteraction } from './shared/analytics/analytics';
import SEOHead, { seoConfigs, generateOrganizationStructuredData } from './shared/components/SEOHead';
import FeedbackWidget from './shared/components/FeedbackWidget';
import SupportChat from './shared/components/SupportChat';
import HelpCenter from './shared/components/HelpCenter';

import './components/Login.css';
import './views/MyCourses.css'; // The new styles

// This is the main application shell
const AppShell = ({ user }) => {
    const [showHelpCenter, setShowHelpCenter] = useState(false);
    const handleSignOut = () => { signOut(auth); };
    
    // Check if user has admin access using role-based system
    const userWithRole = {
        ...user,
        profile: {
            role: detectRoleFromEmail(user?.email)
        }
    };
    const hasAdminAccess = canAccessCommandCenter(userWithRole);

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                <h1>Welcome, {user.displayName || 'VIP Member'}</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {hasAdminAccess && (
                        <button 
                            onClick={() => {
                                trackUserInteraction('admin_center_click', 'header_button');
                                goToCommandCenter();
                            }} 
                            style={{ 
                                padding: '0.5rem 1rem', 
                                cursor: 'pointer',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                            title="Go to Admin Command Center"
                        >
                            🔧 Admin Center
                        </button>
                    )}
                    <button 
                        onClick={() => setShowHelpCenter(true)}
                        style={{ 
                            padding: '0.5rem 1rem', 
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px'
                        }}
                        title="Help & Support"
                    >
                        ❓ Help
                    </button>
                    <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Sign Out</button>
                </div>
            </header>
            <main>
                <MyCourses user={user} />
            </main>
            
            {/* Help Center Modal */}
            {showHelpCenter && (
                <HelpCenter onClose={() => setShowHelpCenter(false)} />
            )}
        </div>
    )
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Initialize analytics when user is authenticated
      if (user) {
        const userRole = detectRoleFromEmail(user.email);
        initializeAnalytics(user.uid, userRole);
        trackPageView('/', 'VIP Learning Portal');
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  // Determine SEO config based on authentication state
  const seoConfig = user ? seoConfigs.profile : seoConfigs.login;
  const structuredData = user ? null : generateOrganizationStructuredData();

  return (
    <div>
      <SEOHead 
        {...seoConfig}
        structuredData={structuredData}
      />
      {user ? <AppShell user={user} /> : <Login />}
      
      {/* Support Widgets (only show for authenticated users) */}
      {user && (
        <>
          <FeedbackWidget context="general" />
          <SupportChat />
        </>
      )}
    </div>
  );
}