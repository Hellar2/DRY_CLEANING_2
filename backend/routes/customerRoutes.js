// ===========================
// Customer Profile & Orders Routes
// ===========================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { 
  getCustomerOrders, 
  createCustomerOrder, 
  getCustomerProfile, 
  requestEmailChangeOTP, 
  updateCustomerProfile,
  trackOrderByQRCode 
} = require('../controllers/customerController');

// IMPORTANT: More specific routes MUST come before generic routes
// /:userId/orders must be before /:userId

// ===========================
// POST Create Customer Order
// ===========================
router.post("/:userId/orders", createCustomerOrder);

// ===========================
// GET Customer Orders
// ===========================
router.get("/:userId/orders", getCustomerOrders);

// ===========================
// POST Request OTP for Email Change
// ===========================
router.post("/:userId/profile/request-otp", requestEmailChangeOTP);

// ===========================
// PUT Update Customer Profile (with OTP verification for email)
// ===========================
router.put("/:userId", updateCustomerProfile);

// ===========================
// GET Track Order by Order Number (Public)
// ===========================
router.get("/track/:orderNumber", trackOrderByQRCode);

// ===========================
// GET Customer Profile by ID
// ===========================
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by ID, exclude password
    const user = await User.findById(userId).select('-password -verificationCode -verificationCodeExpires');
    
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res.status(200).json({
      success: true,
      user: {
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("❌ Error fetching customer profile:", error);
    res.status(500).json({ message: "Server error while fetching customer profile." });
  }
});

module.exports = router;
