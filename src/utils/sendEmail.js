/**
 * Email Utility
 * Handles sending emails using nodemailer.
 * If SMTP credentials are not provided in the .env file, it automatically
 * falls back to using an Ethereal test account and logs a preview URL.
 */
const nodemailer = require('nodemailer');

/**
 * @desc    Send an email
 * @param   {Object} options - Email options containing email, subject, and message
 */
const sendEmail = async (options) => {
  let transporter;

  // 1. Check if we have SMTP credentials configured in .env
  if (process.env.SMTP_HOST && process.env.SMTP_EMAIL) {
    // Use real SMTP credentials
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // 2. Fallback for Development: Use Ethereal automatically
    console.log('No SMTP credentials found in .env. Creating a test email account...');
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  // 3. Define the email options
  const message = {
    from: `${process.env.FROM_NAME || 'Anchord Support'} <${process.env.FROM_EMAIL || 'noreply@anchord.app'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Allow sending rich HTML emails
  };

  // 4. Send the email
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  
  // 5. If we used the test account, log the URL where the email can be previewed!
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
