const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const authMiddleware = require("../middleware/authMiddleware");
const allowedRoles = require("../middleware/roleMiddleware");

// Apply auth middleware to all staff routes
router.use(authMiddleware);

// Apply role middleware - allow both Staff and Admin
router.use(allowedRoles(["Staff", "Admin"]));

// Get dashboard summary statistics
router.get("/summary", staffController.getSummary);

// Search customers
router.get("/customers/search", staffController.searchCustomers);

// Get all orders for staff
router.get("/orders", staffController.staffGetOrders);

// Staff creates a new garment/order
router.post("/orders", staffController.staffCreateOrder);

// Update status or payment of an order
router.put("/orders/:id", staffController.staffUpdateOrder);

module.exports = router;
