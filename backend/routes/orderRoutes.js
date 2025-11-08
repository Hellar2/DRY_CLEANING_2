const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const allowedRoles = require("../middleware/roleMiddleware");

// ===========================
// CUSTOMER ROUTES
// ===========================

// Get my orders (customer only sees their own)
router.get("/my-orders", authMiddleware, allowedRoles(["Customer"]), orderController.getMyOrders);

// Get order by ID (with role-based access)
router.get("/:orderId", authMiddleware, orderController.getOrderById);

// ===========================
// STAFF ROUTES
// ===========================

// Get all orders (staff and admin)
router.get("/", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.getAllOrders);

// Create new order (staff and admin)
router.post("/", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.createOrder);

// Update order status (staff and admin)
router.put("/:orderId/status", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.updateOrderStatus);

// Approve order (staff and admin)
router.put("/:orderId/approve", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.approveOrder);

// Fulfill order (staff and admin)
router.put("/:orderId/fulfill", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.fulfillOrder);

// Delete order (staff and admin)
router.delete("/:orderId", authMiddleware, allowedRoles(["Staff", "Admin"]), orderController.deleteOrder);

module.exports = router;
