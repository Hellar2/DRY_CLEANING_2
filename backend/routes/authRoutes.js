// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  resetPassword, 
  verifyAccount,
  resendOTP 
} = require("../controllers/authController");

// Public: Register a new user
router.post("/signup", register);

// Public: Verify account with code
router.post("/verify", verifyAccount);

// Public: Login (identifier = email or phone)
router.post("/login", login);

// Public: Reset password (identifier + newPassword)
router.post("/reset-password", resetPassword);

// Public: Resend OTP
router.post("/resend-otp", resendOTP);

module.exports = router;
