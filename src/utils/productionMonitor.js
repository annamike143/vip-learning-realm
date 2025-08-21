// Production Health Check and Monitoring Utilities
// This module provides comprehensive health checks and monitoring for production deployment

class ProductionMonitor {
  constructor() {
    this.healthChecks = [];
    this.performanceMetrics = {};
    this.alerts = [];
  }

  // Add health check endpoint
  async performHealthCheck() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: await this.checkDatabase(),
        api: await this.checkAPI(),
        storage: await this.checkStorage(),
        authentication: await this.checkAuth(),
        email: await this.checkEmail(),
        performance: await this.checkPerformance()
      }
    };

    // Determine overall status
    const hasFailures = Object.values(checks.checks).some(check => !check.healthy);
    checks.status = hasFailures ? 'unhealthy' : 'healthy';

    return checks;
  }

  // Database connectivity check
  async checkDatabase() {
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      // Test read operation
      await db.collection('health-check').limit(1).get();
      
      return {
        healthy: true,
        message: 'Database connection successful',
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database error: ${error.message}`,
        error: error.code
      };
    }
  }

  // API endpoints check
  async checkAPI() {
    try {
      const endpoints = [
        '/api/health',
        '/api/auth/status',
        '/api/courses'
      ];

      const results = await Promise.allSettled(
        endpoints.map(endpoint => 
          fetch(process.env.NEXT_PUBLIC_BASE_URL + endpoint)
            .then(res => ({ endpoint, status: res.status, ok: res.ok }))
        )
      );

      const failedEndpoints = results
        .filter(result => result.status === 'rejected' || !result.value.ok)
        .map(result => result.value?.endpoint || 'unknown');

      return {
        healthy: failedEndpoints.length === 0,
        message: failedEndpoints.length === 0 
          ? 'All API endpoints responding' 
          : `Failed endpoints: ${failedEndpoints.join(', ')}`,
        checkedEndpoints: endpoints.length,
        failedEndpoints: failedEndpoints.length
      };
    } catch (error) {
      return {
        healthy: false,
        message: `API check error: ${error.message}`,
        error: error.code
      };
    }
  }

  // Storage connectivity check
  async checkStorage() {
    try {
      const admin = require('firebase-admin');
      const bucket = admin.storage().bucket();
      
      // Test storage access
      const [files] = await bucket.getFiles({ maxResults: 1 });
      
      return {
        healthy: true,
        message: 'Storage access successful',
        fileCount: files.length
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Storage error: ${error.message}`,
        error: error.code
      };
    }
  }

  // Authentication service check
  async checkAuth() {
    try {
      const admin = require('firebase-admin');
      
      // Test auth service
      await admin.auth().listUsers(1);
      
      return {
        healthy: true,
        message: 'Authentication service operational'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Auth error: ${error.message}`,
        error: error.code
      };
    }
  }

  // Email service check
  async checkEmail() {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      });

      // Verify SMTP connection
      await transporter.verify();
      
      return {
        healthy: true,
        message: 'Email service operational'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Email error: ${error.message}`,
        error: error.code
      };
    }
  }

  // Performance metrics check
  async checkPerformance() {
    try {
      const startTime = Date.now();
      
      // Test various operations
      const operations = await Promise.allSettled([
        this.measureDatabaseLatency(),
        this.measureAPILatency(),
        this.measureMemoryUsage()
      ]);

      const totalTime = Date.now() - startTime;

      return {
        healthy: totalTime < 5000, // 5 second threshold
        message: `Performance check completed in ${totalTime}ms`,
        metrics: {
          totalTime,
          operations: operations.length,
          memoryUsage: process.memoryUsage()
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Performance check error: ${error.message}`,
        error: error.code
      };
    }
  }

  // Measure database response time
  async measureDatabaseLatency() {
    const start = Date.now();
    try {
      const admin = require('firebase-admin');
      await admin.firestore().collection('health-check').limit(1).get();
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }

  // Measure API response time
  async measureAPILatency() {
    const start = Date.now();
    try {
      await fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/health');
      return Date.now() - start;
    } catch (error) {
      return -1;
    }
  }

  // Measure memory usage
  measureMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024, // MB
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      external: usage.external / 1024 / 1024 // MB
    };
  }

  // Alert system
  async sendAlert(type, message, severity = 'warning') {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      severity,
      environment: process.env.NODE_ENV
    };

    // Log alert
    console.error(`[${severity.toUpperCase()}] ${type}: ${message}`);

    // Store alert for dashboard
    this.alerts.push(alert);

    // Send notification if critical
    if (severity === 'critical') {
      await this.sendCriticalAlert(alert);
    }

    return alert;
  }

  // Send critical alert notification
  async sendCriticalAlert(alert) {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
        subject: `🚨 CRITICAL ALERT: ${alert.type}`,
        html: `
          <h2>Critical System Alert</h2>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
          <p><strong>Environment:</strong> ${alert.environment}</p>
          <hr>
          <p>Please investigate immediately.</p>
        `
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  // Get system status summary
  getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: this.measureMemoryUsage(),
      alerts: this.alerts.slice(-10), // Last 10 alerts
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Monitor every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.performHealthCheck();
        
        // Check for issues
        const unhealthyServices = Object.entries(health.checks)
          .filter(([_, check]) => !check.healthy)
          .map(([service]) => service);

        if (unhealthyServices.length > 0) {
          await this.sendAlert(
            'service-health',
            `Services unhealthy: ${unhealthyServices.join(', ')}`,
            unhealthyServices.length > 2 ? 'critical' : 'warning'
          );
        }

        // Store metrics
        this.performanceMetrics[Date.now()] = health;

        // Clean old metrics (keep last hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        Object.keys(this.performanceMetrics)
          .filter(timestamp => parseInt(timestamp) < oneHourAgo)
          .forEach(timestamp => delete this.performanceMetrics[timestamp]);

      } catch (error) {
        await this.sendAlert(
          'monitoring-error',
          `Performance monitoring failed: ${error.message}`,
          'warning'
        );
      }
    }, 30000);
  }
}

// Export singleton instance
const productionMonitor = new ProductionMonitor();

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  productionMonitor.startPerformanceMonitoring();
}

module.exports = productionMonitor;
