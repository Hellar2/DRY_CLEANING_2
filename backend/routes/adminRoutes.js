const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const allowedRoles = require("../middleware/roleMiddleware");

// All admin routes require authentication and Admin role
router.use(authMiddleware);
router.use(allowedRoles(["Admin"]));

// ===========================
// DASHBOARD & STATISTICS
// ===========================
router.get("/dashboard", adminController.getDashboardStats);

// ===========================
// USER MANAGEMENT
// ===========================

// Get all users
router.get("/users", adminController.getAllUsers);

// Get user by ID
router.get("/users/:userId", adminController.getUserById);

// Add new user
router.post("/users", adminController.addUser);

// Update user role/privileges
router.put("/users/:userId/role", adminController.updateUserRole);

// Revoke user access
router.put("/users/:userId/revoke", adminController.revokeUserAccess);

// Delete user
router.delete("/users/:userId", adminController.deleteUser);

// ===========================
// SETTINGS (Keep existing)
// ===========================

const Settings = require("../models/Settings");

router.get("/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ siteName: "DryClean Pro", adminEmail: "admin@dryclean.com" });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ===========================
// ORDERS (Keep existing)
// ===========================

const Order = require("../models/Order");

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
