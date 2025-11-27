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

// Generate a 4-digit numeric code for login verification
// Generate a 7-character alphanumeric code for signup verification
const generateVerificationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate a 4-digit numeric code for login verification
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send OTP to user's email
const sendOTP = async (email, otp, type = 'verification') => {
  try {
    const subject = type === 'login' ? 'Your Login Verification Code' : 'Your Email Verification OTP';
    const message = type === 'login' 
      ? 'Your login verification code is:'
      : 'Your OTP for email verification is:';
    const action = type === 'login' ? 'login' : 'verification';

    const mailOptions = {
      from: `"Dry Cleaning Service" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${type === 'login' ? 'Login Verification' : 'Email Verification'}</h2>
          <p>${message}</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This verification code will expire in 10 minutes.</p>
          <p>If you didn't request this ${action}, please ignore this email.</p>
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
  generateVerificationCode,
  sendOTP,
};
