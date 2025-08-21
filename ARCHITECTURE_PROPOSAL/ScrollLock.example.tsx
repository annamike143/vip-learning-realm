// src/components/ui/ScrollLock.tsx
'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollLockProps {
  enabled: boolean;
  children: ReactNode;
  lockPosition?: number;
}

export function ScrollLock({ enabled, children, lockPosition = 0 }: ScrollLockProps) {
  const scrollLocked = useRef(false);
  const originalScrollY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Store original position
    originalScrollY.current = window.scrollY;
    scrollLocked.current = true;

    // Lock scroll at specified position
    const lockScroll = () => {
      if (scrollLocked.current) {
        window.scrollTo(0, lockPosition);
      }
    };

    // Override all scroll methods
    const originalScrollTo = window.scrollTo;
    const originalScrollBy = window.scrollBy;
    
    window.scrollTo = () => {
      if (scrollLocked.current) return;
      originalScrollTo.apply(window, arguments);
    };
    
    window.scrollBy = () => {
      if (scrollLocked.current) return;
      originalScrollBy.apply(window, arguments);
    };

    // Prevent scroll events
    const preventScroll = (e: Event) => {
      if (scrollLocked.current) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo(0, lockPosition);
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('scroll', lockScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        preventScroll(e);
      }
    });

    // Set initial position
    window.scrollTo(0, lockPosition);

    return () => {
      scrollLocked.current = false;
      
      // Restore original methods
      window.scrollTo = originalScrollTo;
      window.scrollBy = originalScrollBy;
      
      // Remove event listeners
      window.removeEventListener('scroll', lockScroll);
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [enabled, lockPosition]);

  return <>{children}</>;
}
