// --- Production Performance Optimizer ---
'use client';

// Lazy loading utilities
export const lazyLoadImages = () => {
    if (typeof window === 'undefined') return;

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
};

// Preload critical resources
export const preloadCriticalResources = () => {
    if (typeof window === 'undefined') return;

    const criticalResources = [
        '/fonts/inter.woff2',
        '/fonts/poppins.woff2',
        '/images/logo.svg'
    ];

    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.woff') ? 'font' : 'image';
        if (resource.includes('.woff')) {
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
    });
};

// Bundle size optimization
export const optimizeBundle = () => {
    // Dynamic imports for heavy components
    const loadHeavyComponent = async (componentName) => {
        switch (componentName) {
            case 'analytics':
                return import('../analytics/analytics');
            case 'chat':
                return import('../components/SupportChat');
            case 'feedback':
                return import('../components/FeedbackWidget');
            default:
                return null;
        }
    };

    return loadHeavyComponent;
};

// Memory optimization
export const optimizeMemory = () => {
    if (typeof window === 'undefined') return;

    // Clean up unused event listeners
    const cleanupEventListeners = () => {
        // Remove orphaned listeners
        const elements = document.querySelectorAll('[data-cleanup]');
        elements.forEach(el => {
            el.removeEventListener('click', null);
            el.removeEventListener('scroll', null);
        });
    };

    // Throttle scroll events
    let scrollTimeout;
    const throttleScroll = (callback, delay = 100) => {
        return (...args) => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                callback.apply(this, args);
                scrollTimeout = null;
            }, delay);
        };
    };

    // Debounce resize events
    let resizeTimeout;
    const debounceResize = (callback, delay = 250) => {
        return (...args) => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                callback.apply(this, args);
            }, delay);
        };
    };

    return { cleanupEventListeners, throttleScroll, debounceResize };
};

// Cache optimization
export const setupCaching = () => {
    if (typeof window === 'undefined') return;

    // Service Worker registration for caching
    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('📦 Service Worker registered successfully');
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    };

    // Local storage optimization
    const optimizeLocalStorage = () => {
        const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
        
        const getCurrentStorageSize = () => {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            return total;
        };

        const cleanupOldData = () => {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage[key]);
                    if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Invalid JSON, keep as is
                }
            });
        };

        if (getCurrentStorageSize() > MAX_STORAGE_SIZE) {
            cleanupOldData();
        }
    };

    return { registerServiceWorker, optimizeLocalStorage };
};

// Network optimization
export const optimizeNetwork = () => {
    // Implement request batching
    const requestQueue = [];
    let batchTimeout;

    const batchRequests = (request) => {
        requestQueue.push(request);
        
        if (batchTimeout) clearTimeout(batchTimeout);
        
        batchTimeout = setTimeout(async () => {
            if (requestQueue.length === 0) return;
            
            try {
                const response = await fetch('/api/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requests: requestQueue })
                });
                
                const results = await response.json();
                // Handle batched results
                
                requestQueue.length = 0; // Clear queue
            } catch (error) {
                console.error('Batch request failed:', error);
            }
        }, 100);
    };

    // Implement retry logic with exponential backoff
    const retryRequest = async (requestFn, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    };

    return { batchRequests, retryRequest };
};

// Initialize all optimizations
export const initializeOptimizations = () => {
    if (typeof window === 'undefined') return;

    // Run optimizations after page load
    window.addEventListener('load', () => {
        preloadCriticalResources();
        lazyLoadImages();
        
        const { optimizeLocalStorage, registerServiceWorker } = setupCaching();
        optimizeLocalStorage();
        registerServiceWorker();
        
        // Monitor performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'measure') {
                    console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
    });
};

export default {
    lazyLoadImages,
    preloadCriticalResources,
    optimizeBundle,
    optimizeMemory,
    setupCaching,
    optimizeNetwork,
    initializeOptimizations
};
