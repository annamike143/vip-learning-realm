// --- src/app/page.js (v2.1 - With True VIP Dashboard) ---
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './lib/firebase';
import Login from './components/Login';
import MyCourses from './views/MyCourses'; // Our new dashboard

import './components/Login.css';
import './views/MyCourses.css'; // The new styles

// This is the main application shell
const AppShell = ({ user }) => {
    const handleSignOut = () => { signOut(auth); };

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                <h1>Welcome, {user.displayName || 'VIP Member'}</h1>
                {/* Dark mode switcher can go here */}
                <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Sign Out</button>
            </header>
            <main>
                <MyCourses user={user} />
            </main>
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
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div>
      {user ? <AppShell user={user} /> : <Login />}
    </div>
  );
}