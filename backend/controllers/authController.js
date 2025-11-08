// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Customer = require("../models/customer");

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

    // Create user in MongoDB (password will be hashed by pre-save hook)
    const user = await User.create({ 
      fullname, 
      email: normEmail, 
      phone: normPhone, 
      password: password, // Plain password - will be hashed by User model pre-save hook
      role: role || "Customer" 
    });
    console.log("New user created in MongoDB:", user);
    
    // If new user is Customer, create Customer entry
    if ((role || "Customer") === "Customer") {
      await Customer.create({ userId: user._id });
      console.log("Customer entry created for user:", user._id);
    }
    
    const token = generateToken({ userId: user._id, role: user.role });
    console.log("Registration successful:", { userId: user._id, role: user.role, fullname: user.fullname });
    
    res.status(201).json({
      message: "Registered",
      token,
      userId: user._id,
      role: user.role,
      fullname: user.fullname
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone
    console.log('🔐 Login attempt:', { identifier, passwordLength: password?.length });
    
    if (!identifier || !password) return res.status(400).json({ message: "Missing credentials" });
    
    // Normalize identifier for robust matching
    const id = identifier.trim();
    const idEmail = id.includes('@') ? normalizeEmail(id) : null;
    const idPhone = normalizePhone(id);

    console.log('🔍 Searching for user in MongoDB:', { idEmail, idPhone });

    // Query MongoDB directly for the user
    const user = await User.findOne({
      $or: [
        ...(idEmail ? [{ email: new RegExp('^' + idEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] : []),
        ...(idPhone ? [{ phone: idPhone }] : [])
      ]
    });

    if (!user) {
      console.log('❌ User not found in MongoDB');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ User found in MongoDB:', { email: user.email, role: user.role });

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ userId: user._id, role: user.role });

    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      role: user.role,
      fullname: user.fullname
    });
  } catch (err) {
    console.error("login error:", err);
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
