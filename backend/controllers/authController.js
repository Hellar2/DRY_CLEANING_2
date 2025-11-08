// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Customer = require("../models/customer");

// Load users dataset
const usersDatasetPath = path.join(__dirname, "..", "config", "usersDataset.json");
let usersDataset = [];
try {
  const data = fs.readFileSync(usersDatasetPath, "utf8");
  usersDataset = JSON.parse(data);
} catch (err) {
  console.error("Failed to load users dataset:", err);
}

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

// Save dataset back to file
function saveDataset() {
  try {
    fs.writeFileSync(usersDatasetPath, JSON.stringify(usersDataset, null, 2));
  } catch (err) {
    console.error("Failed to save users dataset:", err);
  }
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

    // Check if user exists in dataset (normalize to avoid formatting mismatches)
    const existsInDataset = usersDataset.find(u => normalizeEmail(u.email) === normEmail || normalizePhone(u.phone) === normPhone);
    if (existsInDataset) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user ID
    const userId = "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    
    // Add to dataset
    const newUser = {
      userId,
      fullname,
      email: normEmail,
      phone: normPhone,
      password: hashedPassword,
      role: role || "Customer"
    };
    usersDataset.push(newUser);
    console.log("New user added to dataset:", newUser);
    saveDataset();

    // Also save to database for other features (orders, payments, etc.)
  // Also save to database for other features (keep DB entry similar but ensure email stored consistently)
  const user = await User.create({ fullname, email: normEmail, phone: normPhone, password: hashedPassword, role: role || "Customer" });
console.log("New user created in DB:", user);
    // If new user is Customer, create Customer entry
    if ((role || "Customer") === "Customer") {
      await Customer.create({ userId: user._id });
    }
console.log("Customer entry created for user:", user._id);
    const token = generateToken({ userId: user._id, role: user.role });
    console.log("sending data to user:", { userId: user._id, role: user.role, message: "Registered", token, fullname: user.fullname });
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
    if (!identifier || !password) return res.status(400).json({ message: "Missing credentials" });
    // Normalize identifier for robust matching
    const id = identifier.trim();
    const idEmail = id.includes('@') ? normalizeEmail(id) : null;
    const idPhone = normalizePhone(id);

    // Check dataset first (as per requirement) — use normalized comparisons
    const userFromDataset = usersDataset.find(u => {
      const uEmail = normalizeEmail(u.email);
      const uPhone = normalizePhone(u.phone);
      return (idEmail && uEmail === idEmail) || (uPhone && uPhone === idPhone);
    });

    if (!userFromDataset) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, userFromDataset.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get user from DB to get the MongoDB _id for token. Use case-insensitive email match.
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const user = await User.findOne({ $or: [ { email: new RegExp('^' + escapeRegex(userFromDataset.email) + '$', 'i') }, { phone: userFromDataset.phone } ] });
    const userId = user ? user._id : userFromDataset.userId;

    const token = generateToken({ userId, role: userFromDataset.role });

    res.json({
      message: "Login successful",
      token,
      userId,
      role: userFromDataset.role,
      fullname: userFromDataset.fullname
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

    // Find user in dataset
      const id = identifier.trim();
      const idEmail = id.includes('@') ? normalizeEmail(id) : null;
      const idPhone = normalizePhone(id);
      const userIndex = usersDataset.findIndex(u => {
        const uEmail = normalizeEmail(u.email);
        const uPhone = normalizePhone(u.phone);
        return (idEmail && uEmail === idEmail) || (uPhone && uPhone === idPhone);
      });
    if (userIndex === -1) return res.status(404).json({ message: "User not found" });

    // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      usersDataset[userIndex].password = hashedPassword;
      saveDataset();

      // Also update in database (store hashed password)
      const user = await User.findOne({ $or: [{ email: idEmail }, { phone: idPhone }] });
      if (user) {
        user.password = hashedPassword;
        await user.save();
      }

      res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
