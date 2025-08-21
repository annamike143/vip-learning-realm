// --- Email Configuration for SMTP2GO Integration ---

export const emailConfig = {
  smtp: {
    host: 'mail.smtp2go.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.SMTP_USERNAME, // Your SMTP2GO username
      pass: process.env.SMTP_PASSWORD  // Your SMTP2GO password
    }
  },
  
  defaults: {
    from: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@courses.themikesalazar.com',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@courses.themikesalazar.com'
  },
  
  templates: {
    welcome: {
      subject: 'Welcome to The Mike Salazar Academy!',
      template: 'welcome-email'
    },
    passwordReset: {
      subject: 'Reset Your Password - Mike Salazar Academy',
      template: 'password-reset'
    },
    courseEnrollment: {
      subject: 'Course Enrollment Confirmation',
      template: 'enrollment-confirmation'
    },
    progressUpdate: {
      subject: 'Course Progress Update',
      template: 'progress-update'
    }
  }
};

// Email sending utility function
export async function sendEmail({ to, subject, html, text, template }) {
  try {
    // This would integrate with SMTP2GO API or nodemailer
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        template
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}
