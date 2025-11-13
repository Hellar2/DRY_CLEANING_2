// =======================
// Customer Controller
// =======================

const User = require("../models/User");
const Order = require("../models/Order");
const Payment = require("../models/payment");
const QRCode = require("qrcode");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateOTP, sendOTP } = require("../utils/emailService");
const moment = require('moment');

/**
 * @desc    Get all orders belonging to a specific customer
 * @route   GET /api/customer/:userId/orders
 * @access  Customer
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this customer." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching customer orders:", error);
    res.status(500).json({ message: "Server error while fetching customer orders." });
  }
};

/**
 * @desc    Create a new order and generate QR code for tracking
 * @route   POST /api/customer/:userId/orders
 * @access  Customer
 */
exports.createCustomerOrder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { garmentType, items, quantity, serviceType, price, totalAmount } = req.body;

    console.log('🛒 Creating order for customer:', userId);

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one item is required" });
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}`;

    // Calculate total if not provided
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = totalAmount || price || calculatedTotal;

    // Generate tracking URL for QR code
    const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track.html?order=${orderNumber}`;
    console.log('🔗 Track URL:', trackUrl);

    // Generate QR code for tracking
    console.log('📱 Generating QR code...');
    const qrCode = await QRCode.toDataURL(trackUrl);
    console.log('✅ QR code generated successfully');

    // Create order object
    const orderData = {
      userId: userId,
      orderNumber,
      garmentType: garmentType || items.map(i => i.itemType).join(', '),
      quantity: quantity || items.reduce((sum, item) => sum + item.quantity, 0),
      serviceType: serviceType || 'Standard',
      price: finalTotal,
      totalAmount: finalTotal,
      items: items,
      status: 'Received',
      paymentStatus: 'Pending',
      qrCode: qrCode
    };

    console.log('📋 Order data prepared');

    // Save order to database
    const newOrder = await Order.create(orderData);
    console.log('✅ Order created and saved successfully:', newOrder.orderNumber);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });

  } catch (error) {
    console.error("❌ Error creating customer order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while creating order", 
      error: error.message 
    });
  }
};

/**
 * @desc    Track order using order number (QR scan)
 * @route   GET /api/customer/track/:orderNumber
 * @access  Public
 */
exports.trackOrderByQRCode = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        garmentType: order.garmentType,
        serviceType: order.serviceType,
        quantity: order.quantity,
        status: order.status,
        price: order.price,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error tracking order:", error);
    res.status(500).json({ success: false, message: "Server error while tracking order." });
  }
};

/**
 * @desc    Get all payments made by a specific customer
 * @route   GET /api/customer/:userId/payments
 * @access  Customer
 */
exports.getCustomerPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ customerId: userId }).sort({ date: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: "No payment history found for this customer." });
    }

    res.status(200).json(payments);
  } catch (error) {
    console.error("❌ Error fetching customer payments:", error);
    res.status(500).json({ message: "Server error while fetching payments." });
  }
};

/**
 * @desc    Get customer profile details
 * @route   GET /api/customer/:userId/profile
 * @access  Customer
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching customer profile:", error);
    res.status(500).json({ message: "Server error while fetching customer profile." });
  }
};

/**
 * @desc    Request OTP for email change
 * @route   POST /api/customer/:userId/profile/request-otp
 * @access  Customer
 */
exports.requestEmailChangeOTP = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: "New email is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ 
      email: new RegExp('^' + newEmail.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = moment().add(process.env.OTP_EXPIRATION || 10, 'minutes').toDate();

    user.verificationCode = otp;
    user.verificationCodeExpires = otpExpires;
    await user.save();

    // Send OTP to new email
    const emailSent = await sendOTP(newEmail, otp);

    if (!emailSent) {
      throw new Error('Failed to send OTP email');
    }

    res.status(200).json({
      message: `OTP sent to ${newEmail}`,
      requiresOTP: true
    });
  } catch (error) {
    console.error("❌ Error requesting OTP:", error);
    res.status(500).json({ message: "Server error while requesting OTP." });
  }
};

/**
 * @desc    Update customer profile (phone, email, name) with OTP verification for email
 * @route   PUT /api/customer/:userId/profile
 * @access  Customer
 */
exports.updateCustomerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullname, phone, email, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // If email is being changed, verify OTP
    if (email && email !== user.email) {
      if (!otp) {
        return res.status(400).json({ 
          message: "OTP is required to change email.",
          requiresOTP: true
        });
      }

      // Verify OTP
      if (user.verificationCode !== otp) {
        return res.status(401).json({ 
          message: "Invalid OTP.",
          requiresOTP: true
        });
      }

      if (moment().isAfter(moment(user.verificationCodeExpires))) {
        return res.status(401).json({ 
          message: "OTP has expired. Please request a new one.",
          requiresOTP: true
        });
      }

      // Clear OTP after verification
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
    }

    // Update profile fields
    if (fullname) user.fullname = fullname;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        fullname: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

/**
 * @desc    Get a quick summary for the customer dashboard
 * @route   GET /api/customer/:userId/summary
 * @access  Customer
 */
exports.getCustomerDashboardSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const [received, inProgress, completed, pendingPayments] = await Promise.all([
      Order.countDocuments({ customerId: userId, status: "Received" }),
      Order.countDocuments({ customerId: userId, status: "In Progress" }),
      Order.countDocuments({ customerId: userId, status: "Completed" }),
      Order.countDocuments({ customerId: userId, paymentStatus: "Pending" }),
    ]);

    res.status(200).json({
      received,
      inProgress,
      completed,
      pendingPayments,
    });
  } catch (error) {
    console.error("❌ Error fetching customer summary:", error);
    res.status(500).json({ message: "Server error while fetching dashboard summary." });
  }
};

// Export all controller functions
module.exports = {
  getCustomerOrders: exports.getCustomerOrders,
  createCustomerOrder: exports.createCustomerOrder,
  trackOrderByQRCode: exports.trackOrderByQRCode,
  getCustomerPayments: exports.getCustomerPayments,
  getCustomerProfile: exports.getCustomerProfile,
  requestEmailChangeOTP: exports.requestEmailChangeOTP,
  updateCustomerProfile: exports.updateCustomerProfile,
  getCustomerDashboardSummary: exports.getCustomerDashboardSummary,
};
