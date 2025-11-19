// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require("../models/User");
const Customer = require("../models/customer");
const { generateOTP, sendOTP } = require("../utils/emailService");
const moment = require('moment');

// Login session store (in-memory for demo, use Redis in production)
const loginSessions = new Map();

// Helpers to normalize identifiers (emails => lowercase, phones => digits-only)
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function normalizePhone(phone) {
  return typeof phone === 'string' ? phone.replace(/\D/g, '') : phone;
}

function generateToken(payload) {
  const secret = process.env.JWT_SECRET || "yoursecret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.register = async (req, res) => {
  console.log("Register request body:", req.body);
  try {
    const { fullname, email, phone, password, role } = req.body;
    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    // Normalize incoming values
    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);

    // Check if user exists in MongoDB
    const existingUser = await User.findOne({
      $or: [
        { email: new RegExp('^' + normEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
        { phone: normPhone }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user in MongoDB (password will be hashed by pre-save hook)
    const user = await User.create({ 
      fullname, 
      email: normEmail, 
      phone: normPhone, 
      password: password, // Plain password - will be hashed by User model pre-save hook
      role: role || "Customer",
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    });
    console.log("New user created in MongoDB:", user);
    
    // Send verification code to user's email
    const emailSent = await sendOTP(normEmail, verificationCode);
    
    if (!emailSent) {
      console.error("Failed to send verification email to:", normEmail);
      // Still continue with registration but note the email failure
    } else {
      console.log("Verification code sent to email:", normEmail);
    }
    
    // If new user is Customer, create Customer entry
    if ((role || "Customer") === "Customer") {
      await Customer.create({ userId: user._id });
      console.log("Customer entry created for user:", user._id);
    }
    
    const token = generateToken({ userId: user._id, role: user.role });
    console.log("Registration successful:", { userId: user._id, role: user.role, fullname: user.fullname });
    
    res.status(201).json({
      message: "Registered - Please check your email for verification code",
      userId: user._id,
      role: user.role,
      fullname: user.fullname,
      email: normEmail,
      requiresVerification: true
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Start login process by sending OTP
exports.initiateLogin = async (req, res) => {
  try {
    const { identifier } = req.body;
    console.log('🔐 Login initiation for:', identifier);
    
    if (!identifier) return res.status(400).json({ message: "Email or phone is required" });
    
    // Normalize identifier for robust matching
    const id = identifier.trim();
    const idEmail = id.includes('@') ? normalizeEmail(id) : null;
    const idPhone = normalizePhone(id);

    console.log('🔍 Searching for user:', { idEmail, idPhone });

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        ...(idEmail ? [{ email: new RegExp('^' + idEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] : []),
        ...(idPhone ? [{ phone: idPhone }] : [])
      ]
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 4-digit OTP
    const otp = generateOTP();
    const otpExpires = moment().add(10, 'minutes').toDate();
    
    // Store OTP in memory (use Redis in production)
    loginSessions.set(user._id.toString(), {
      otp,
      expires: otpExpires,
      attempts: 0
    });

    // Send OTP via email
    const emailToSend = idEmail || user.email;
    if (!emailToSend) {
      return res.status(400).json({ message: "No email found for this account" });
    }

    const emailSent = await sendOTP(emailToSend, otp, 'login');
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    console.log('✅ OTP sent to:', emailToSend);
    res.json({ 
      message: "OTP sent to your email", 
      userId: user._id,
      email: emailToSend,
      expiresIn: '10 minutes'
    });

  } catch (err) {
    console.error("Login initiation error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Verify OTP and complete login
exports.verifyOTPLogin = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    console.log('🔑 Verifying OTP for user:', userId);
    
    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    // Get login session
    const session = loginSessions.get(userId);
    if (!session) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    // Check if OTP is expired
    if (moment().isAfter(session.expires)) {
      loginSessions.delete(userId);
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check OTP attempts
    if (session.attempts >= 3) {
      loginSessions.delete(userId);
      return res.status(429).json({ message: "Too many attempts. Please try again." });
    }

    // Verify OTP
    if (session.otp !== otp) {
      session.attempts += 1;
      const remainingAttempts = 3 - session.attempts;
      return res.status(400).json({ 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        remainingAttempts
      });
    }

    // OTP is valid, get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Auto-verify customer if not verified
    if (user.role === 'Customer' && !user.isVerified) {
      user.isVerified = true;
      await user.save();
      console.log('✅ Customer auto-verified after OTP login:', user.email);
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });
    
    // Clear the OTP session
    loginSessions.delete(userId);

    console.log('✅ Login successful for user:', user.email);
    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      role: user.role,
      fullname: user.fullname,
      isVerified: user.isVerified
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// Resend OTP for login
// Resend OTP for login
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = moment().add(10, 'minutes').toDate();
    
    // Update session
    loginSessions.set(user._id.toString(), {
      otp,
      expires: otpExpires,
      attempts: 0
    });
    
    // Send new OTP
    const emailSent = await sendOTP(user.email, otp, 'login');
    
    if (!emailSent) {
      throw new Error('Failed to send OTP email');
    }
    
    res.json({
      message: `New OTP sent to ${user.email}`,
      expiresIn: '10 minutes'
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;
    
    if (!userId || !verificationCode) {
      return res.status(400).json({ message: "User ID and verification code required" });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Check if code has expired
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    // Check if code matches
    if (user.verificationCode !== verificationCode.toUpperCase()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate token after verification
    const token = generateToken({ userId: user._id, role: user.role });

    console.log("✅ Account verified successfully for user:", user.email);
    
    res.json({
      message: "Account verified successfully",
      token,
      userId: user._id,
      role: user.role,
      fullname: user.fullname
    });
  } catch (err) {
    console.error("verifyAccount error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Accepts identifier (email or phone) and newPassword
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) return res.status(400).json({ message: "Missing fields" });

    // Normalize identifier
    const id = identifier.trim();
    const idEmail = id.includes('@') ? normalizeEmail(id) : null;
    const idPhone = normalizePhone(id);

    // Find user in MongoDB
    const user = await User.findOne({
      $or: [
        ...(idEmail ? [{ email: new RegExp('^' + idEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] : []),
        ...(idPhone ? [{ phone: idPhone }] : [])
      ]
    });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log("Password reset successful for user:", user.email);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
