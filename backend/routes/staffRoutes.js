const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

// Staff creates a new garment/order
router.post("/orders", staffController.staffCreateOrder);

// Get all orders for staff
router.get("/orders", staffController.staffGetOrders);

// Update status or payment of an order
router.put("/orders/:id", staffController.staffUpdateOrder);

module.exports = router;
