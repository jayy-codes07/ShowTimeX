const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a reusable transporter using the default SMTP transport
  // Note: For production, configure these in your .env file
  // (e.g., SendGrid, Mailgun, Amazon SES, or a standard SMTP server)
  let transporter;

  // Simple check: If SMTP host is configured in .env, use it; otherwise create Ethereal test account
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email for local development
    // Only needed if you don't have a real SMTP set up
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

  // Define the email options
  const message = {
    from: `${process.env.FROM_NAME || 'ShowTimeX'} <${process.env.FROM_EMAIL || 'noreply@showtimex.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
  };

  // Send the email
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  
  // Preview only available when sending through an Ethereal account
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
