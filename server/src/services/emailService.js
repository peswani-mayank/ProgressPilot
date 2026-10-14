/**
 * Transactional Email Service for ProgressPilot
 * Supports both Nodemailer (Gmail / SMTP) and Resend API.
 */
import nodemailer from 'nodemailer';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Builds responsive HTML email template for accountability reminder
 */
export const buildReminderHtml = ({
  displayName,
  dateStr,
  message,
  pendingTasks = [],
  dashboardUrl,
}) => {
  const tasksHtml = pendingTasks
    .map((task) => {
      const priorityColor =
        task.priority === 'high'
          ? '#e11d48'
          : task.priority === 'medium'
          ? '#d97706'
          : '#4f46e5';

      const priorityBg =
        task.priority === 'high'
          ? '#ffe4e6'
          : task.priority === 'medium'
          ? '#fef3c7'
          : '#e0e7ff';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">
              ${escapeHtml(task.title)}
            </div>
            ${
              task.estimatedDuration
                ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Planned: ${task.estimatedDuration} mins</div>`
                : ''
            }
          </td>
          <td style="padding: 12px 0; text-align: right;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: ${priorityBg}; color: ${priorityColor};">
              ${escapeHtml(task.priority || 'medium')}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProgressPilot Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px; background: linear-gradient(135deg, #4f46e5, #6366f1); text-align: left;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div style="font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                ⚡ ProgressPilot
              </div>
              <div style="font-size: 13px; color: #c7d2fe; margin-top: 4px;">
                Smart Daily Accountability • ${escapeHtml(dateStr)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px;">
          ${escapeHtml(displayName ? `Hi ${displayName},` : 'Hello,')}
        </h2>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
          ${escapeHtml(message)}
        </p>

        <!-- Tasks Table -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1;">
              <th align="left" style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">
                Pending Task
              </th>
              <th align="right" style="padding-bottom: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            ${tasksHtml}
          </tbody>
        </table>

        <!-- CTA Button -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${escapeHtml(dashboardUrl)}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">
                Open Today's Plan & Timer →
              </a>
            </td>
          </tr>
        </table>

        <!-- Encouragement -->
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
          "Even a single 25-minute Pomodoro session will keep your momentum alive today."
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
        You received this email because Smart Accountability Reminders are enabled on your account.<br/>
        You can snooze or adjust your preferred reminder window anytime in your <strong>ProgressPilot Settings</strong>.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Builds plain-text email alternative
 */
export const buildReminderText = ({
  displayName,
  dateStr,
  message,
  pendingTasks = [],
  dashboardUrl,
}) => {
  const tasksText = pendingTasks
    .map((t) => `• [${t.priority?.toUpperCase() || 'NORMAL'}] ${t.title}`)
    .join('\n');

  return `
ProgressPilot Daily Accountability Reminder
Date: ${dateStr}

${displayName ? `Hi ${displayName},\n\n` : ''}${message}

Pending Tasks:
${tasksText}

Open your dashboard to start a focus timer:
${dashboardUrl}

You can adjust or pause your reminders anytime in ProgressPilot Settings.
`.trim();
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Dispatches an email using Gmail/SMTP (Nodemailer) or Resend API.
 */
export const sendAccountabilityEmail = async ({
  to,
  subject,
  html,
  text,
  retryCount = 0,
}) => {
  if (!to || !to.includes('@')) {
    return {
      success: false,
      error: 'Invalid recipient email address.',
      status: 'failed',
    };
  }

  // 1. Check if test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      messageId: `mock_test_${Date.now()}`,
      status: 'delivered',
      isMock: true,
    };
  }

  // 2. Check for Gmail / Custom SMTP credentials (easiest for personal email)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"ProgressPilot" <${smtpUser}>`,
        to,
        subject,
        html,
        text,
      });

      return {
        success: true,
        messageId: info.messageId,
        status: 'delivered',
        provider: 'smtp',
      };
    } catch (err) {
      console.error('[SMTP Error]:', err.message);
      if (retryCount === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return sendAccountabilityEmail({ to, subject, html, text, retryCount: 1 });
      }
      return {
        success: false,
        error: `SMTP error: ${err.message}`,
        status: 'failed',
      };
    }
  }

  // 3. Check for Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && retryCount === 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return sendAccountabilityEmail({ to, subject, html, text, retryCount: 1 });
        }

        return {
          success: false,
          error: data.message || `Resend responded with status ${response.status}`,
          status: 'failed',
        };
      }

      return {
        success: true,
        messageId: data.id,
        status: 'delivered',
        provider: 'resend',
      };
    } catch (err) {
      if (retryCount === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return sendAccountabilityEmail({ to, subject, html, text, retryCount: 1 });
      }

      return {
        success: false,
        error: err.message,
        status: 'failed',
      };
    }
  }

  // 4. No email credentials configured in .env
  return {
    success: false,
    error: 'No email credentials configured. Please set SMTP_USER & SMTP_PASS or RESEND_API_KEY in server/.env',
    status: 'not_configured',
  };
};
