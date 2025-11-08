// ===========================
// QR Code Route - Public Order View
// ===========================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

// Get customer orders by userId (for QR code scanning)
router.get("/:userId/orders", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by ID
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch user's orders
    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

    // Return JSON response
    res.json({
      user: {
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      orders: orders,
      totalOrders: orders.length
    });

  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
