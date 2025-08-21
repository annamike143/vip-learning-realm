// --- Production Monitoring Setup ---

// Error tracking configuration
export const errorTracking = {
    // Sentry configuration
    sentry: {
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_APP_VERSION,
        beforeSend(event) {
            // Filter out noise
            if (event.exception) {
                const error = event.exception.values[0];
                if (error.value?.includes('Non-Error promise rejection')) {
                    return null;
                }
            }
            return event;
        }
    },

    // Custom error tracking
    trackError: (error, context = {}) => {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: context.userId,
            ...context
        };

        // Send to multiple endpoints
        Promise.all([
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData)
            }),
            // Send to external service
            fetch(`${process.env.NEXT_PUBLIC_ERROR_ENDPOINT}`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorData)
            })
        ]).catch(console.error);
    }
};

// Performance monitoring
export const performanceMonitoring = {
    // Core Web Vitals tracking
    webVitals: {
        onCLS: (metric) => {
            sendMetric('cumulative_layout_shift', metric.value);
        },
        onFID: (metric) => {
            sendMetric('first_input_delay', metric.value);
        },
        onFCP: (metric) => {
            sendMetric('first_contentful_paint', metric.value);
        },
        onLCP: (metric) => {
            sendMetric('largest_contentful_paint', metric.value);
        },
        onTTFB: (metric) => {
            sendMetric('time_to_first_byte', metric.value);
        }
    },

    // Custom performance tracking
    trackPageLoad: (pageName) => {
        const startTime = performance.now();
        
        return {
            end: () => {
                const duration = performance.now() - startTime;
                sendMetric('page_load_time', duration, { page: pageName });
            }
        };
    },

    // API performance tracking
    trackAPICall: (endpoint, method = 'GET') => {
        const startTime = performance.now();
        
        return {
            success: () => {
                const duration = performance.now() - startTime;
                sendMetric('api_response_time', duration, { 
                    endpoint, 
                    method, 
                    status: 'success' 
                });
            },
            error: (error) => {
                const duration = performance.now() - startTime;
                sendMetric('api_response_time', duration, { 
                    endpoint, 
                    method, 
                    status: 'error',
                    error: error.message 
                });
            }
        };
    }
};

// User behavior analytics
export const behaviorAnalytics = {
    // Track user journey
    trackUserJourney: (action, data = {}) => {
        const journeyData = {
            action,
            timestamp: Date.now(),
            url: window.location.href,
            referrer: document.referrer,
            sessionId: getSessionId(),
            ...data
        };

        // Send to analytics service
        fetch('/api/analytics/journey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(journeyData)
        });
    },

    // Heatmap and click tracking
    setupHeatmaps: () => {
        document.addEventListener('click', (event) => {
            const clickData = {
                x: event.clientX,
                y: event.clientY,
                element: event.target.tagName,
                className: event.target.className,
                id: event.target.id,
                url: window.location.pathname,
                timestamp: Date.now()
            };

            // Batch click data
            if (!window.clickData) window.clickData = [];
            window.clickData.push(clickData);

            // Send batched data every 10 clicks or 30 seconds
            if (window.clickData.length >= 10) {
                sendClickBatch();
            }
        });

        // Send batch on interval
        setInterval(sendClickBatch, 30000);
    },

    // Scroll depth tracking
    trackScrollDepth: () => {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 100];
        const reached = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);

            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !reached.has(milestone)) {
                    reached.add(milestone);
                    sendMetric('scroll_depth', milestone, { 
                        url: window.location.pathname 
                    });
                }
            });
        });
    }
};

// Uptime monitoring
export const uptimeMonitoring = {
    // Health check endpoint
    healthCheck: async () => {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }
            
            return {
                status: 'healthy',
                timestamp: Date.now(),
                ...data
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: Date.now()
            };
        }
    },

    // Service monitoring
    monitorServices: async () => {
        const services = {
            firebase_auth: () => checkFirebaseAuth(),
            firebase_database: () => checkFirebaseDatabase(),
            openai_api: () => checkOpenAIAPI(),
            analytics: () => checkAnalytics()
        };

        const results = {};
        
        for (const [service, check] of Object.entries(services)) {
            try {
                results[service] = await check();
            } catch (error) {
                results[service] = { status: 'error', error: error.message };
            }
        }

        return results;
    }
};

// Alert system
export const alertSystem = {
    // Define alert thresholds
    thresholds: {
        error_rate: 5, // 5% error rate
        response_time: 2000, // 2 seconds
        memory_usage: 80, // 80% memory usage
        cpu_usage: 80, // 80% CPU usage
        disk_usage: 85 // 85% disk usage
    },

    // Check thresholds and send alerts
    checkAlerts: (metrics) => {
        Object.entries(metrics).forEach(([metric, value]) => {
            const threshold = alertSystem.thresholds[metric];
            
            if (threshold && value > threshold) {
                sendAlert({
                    type: 'threshold_exceeded',
                    metric,
                    value,
                    threshold,
                    timestamp: Date.now(),
                    severity: getSeverity(metric, value, threshold)
                });
            }
        });
    },

    // Send alerts to multiple channels
    sendAlert: async (alert) => {
        const alertData = {
            ...alert,
            environment: process.env.NODE_ENV,
            service: 'vip-learning-realm'
        };

        // Send to Slack
        if (process.env.SLACK_WEBHOOK_URL) {
            fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 Alert: ${alert.type}`,
                    attachments: [{
                        color: alert.severity === 'critical' ? 'danger' : 'warning',
                        fields: [
                            { title: 'Metric', value: alert.metric, short: true },
                            { title: 'Value', value: alert.value, short: true },
                            { title: 'Threshold', value: alert.threshold, short: true },
                            { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
                        ]
                    }]
                })
            });
        }

        // Send to email
        if (process.env.ALERT_EMAIL_ENDPOINT) {
            fetch(process.env.ALERT_EMAIL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            });
        }

        // Log alert
        console.error('🚨 ALERT:', alertData);
    }
};

// Utility functions
const sendMetric = (name, value, tags = {}) => {
    const metricData = {
        name,
        value,
        timestamp: Date.now(),
        tags: {
            environment: process.env.NODE_ENV,
            service: 'vip-learning-realm',
            ...tags
        }
    };

    // Send to metrics endpoint
    fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricData)
    }).catch(console.error);
};

const sendClickBatch = () => {
    if (window.clickData && window.clickData.length > 0) {
        fetch('/api/analytics/clicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.clickData)
        });
        window.clickData = [];
    }
};

const getSessionId = () => {
    if (!window.sessionId) {
        window.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.sessionId;
};

const getSeverity = (metric, value, threshold) => {
    const ratio = value / threshold;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
};

// Service health checks
const checkFirebaseAuth = async () => {
    // Implementation depends on your Firebase setup
    return { status: 'healthy' };
};

const checkFirebaseDatabase = async () => {
    // Implementation depends on your Firebase setup
    return { status: 'healthy' };
};

const checkOpenAIAPI = async () => {
    // Implementation depends on your OpenAI setup
    return { status: 'healthy' };
};

const checkAnalytics = async () => {
    // Implementation depends on your analytics setup
    return { status: 'healthy' };
};

// Initialize monitoring
export const initializeMonitoring = () => {
    if (typeof window === 'undefined') return;

    // Setup error tracking
    window.addEventListener('error', (event) => {
        errorTracking.trackError(event.error, {
            type: 'javascript_error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        errorTracking.trackError(new Error(event.reason), {
            type: 'unhandled_promise_rejection'
        });
    });

    // Setup behavior tracking
    behaviorAnalytics.setupHeatmaps();
    behaviorAnalytics.trackScrollDepth();

    // Setup periodic health checks
    setInterval(async () => {
        const health = await uptimeMonitoring.healthCheck();
        if (health.status !== 'healthy') {
            alertSystem.sendAlert({
                type: 'health_check_failed',
                error: health.error,
                timestamp: Date.now(),
                severity: 'high'
            });
        }
    }, 60000); // Check every minute

    console.log('📊 Production monitoring initialized');
};

export default {
    errorTracking,
    performanceMonitoring,
    behaviorAnalytics,
    uptimeMonitoring,
    alertSystem,
    initializeMonitoring
};
