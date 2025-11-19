// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { 
  register, 
  initiateLogin,
  verifyOTPLogin,
  resetPassword, 
  verifyAccount,
  resendOTP 
} = require("../controllers/authController");

// Public: Register a new user
router.post("/signup", register);

// Public: Verify account with code
router.post("/verify", verifyAccount);

// Public: Start login process with OTP
router.post("/login/initiate", initiateLogin);

// Public: Verify OTP and complete login
router.post("/login/verify", verifyOTPLogin);

// Public: Reset password (identifier + newPassword)
router.post("/reset-password", resetPassword);

// Public: Resend OTP for login
router.post("/resend-otp", resendOTP);

module.exports = router;
