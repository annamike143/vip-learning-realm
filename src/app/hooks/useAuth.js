// src/app/hooks/useAuth.js (ENHANCED - With freeze status checking)
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../lib/firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userStatus, setUserStatus] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Check user status in database
                    const userStatusRef = ref(database, `users/${firebaseUser.uid}/profile/status`);
                    const statusSnapshot = await get(userStatusRef);
                    const status = statusSnapshot.val() || 'active';
                    
                    setUserStatus(status);
                    
                    // If user is frozen, sign them out immediately
                    if (status === 'frozen') {
                        await signOut(auth);
                        
                        // Show contextual suspended account message
                        const suspendMessage = `
🔒 Account Temporarily Suspended

Your account is currently on hold and access has been temporarily restricted.

📧 Please contact your instructor or support team to resolve this issue:
• Email your instructor directly
• Contact support for assistance
• Check for any pending communications

Your progress and data are safely preserved and will be restored once the hold is lifted.
                        `;
                        
                        alert(suspendMessage);
                        setUser(null);
                        setUserStatus(null);
                        setLoading(false);
                        return;
                    }
                    
                    // User is active, proceed normally
                    setUser(firebaseUser);
                } catch (error) {
                    console.error('Error checking user status:', error);
                    // If we can't check status, assume active and proceed
                    setUser(firebaseUser);
                    setUserStatus('active');
                }
            } else {
                setUser(null);
                setUserStatus(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading, userStatus };
}