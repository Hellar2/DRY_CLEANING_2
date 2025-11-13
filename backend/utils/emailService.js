const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Check if environment variables are loaded
console.log('Email Service Debug:');
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME ? 'Found' : 'Missing');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Found' : 'Missing');

// Validate environment variables
if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  console.error('Missing email credentials in environment variables');
  throw new Error('EMAIL_USERNAME and EMAIL_PASSWORD must be set in .env file');
}

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to user's email
const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Dry Cleaning Service" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Your Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    
    // Provide specific guidance for Gmail authentication errors
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n🔧 GMAIL AUTHENTICATION FIX REQUIRED:');
      console.error('1. Enable 2-Factor Authentication on your Gmail account');
      console.error('2. Generate an App Password at: https://myaccount.google.com/apppasswords');
      console.error('3. Use the 16-character App Password (NOT your regular password)');
      console.error('4. Update EMAIL_PASSWORD in .env file with the App Password\n');
    }
    
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTP,
};
