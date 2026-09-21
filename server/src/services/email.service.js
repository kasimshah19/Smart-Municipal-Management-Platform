import nodemailer from 'nodemailer';

const createTransporter = () => {
  // Return null if no configuration is provided so the app can still run in dev
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('⚠️ EMAIL_HOST or EMAIL_USER not configured. Emails will be logged instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n--- MOCK EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('------------------\n');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Smart Municipal Platform" <noreply@smartmunicipal.com>',
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const html = `
    <h1>Welcome to Smart Municipal Platform</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verifyUrl}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({ to: email, subject: 'Verify Your Email Address', html });
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  const html = `
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you didn't request this, please ignore this email. This link will expire in 1 hour.</p>
  `;

  await sendEmail({ to: email, subject: 'Password Reset Request', html });
};
