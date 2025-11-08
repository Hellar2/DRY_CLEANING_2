// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, resetPassword } = require("../controllers/authController");

// Public: Register a new user
router.post("/signup", register);

// Public: Login (identifier = email or phone)
router.post("/login", login);

// Public: Reset password (identifier + newPassword)
router.post("/reset-password", resetPassword);

module.exports = router;
