// =======================
// Customer Controller
// =======================

const User = require("../models/User");
const Order = require("../models/Order");
const Payment = require("../models/payment");
const QRCode = require("qrcode");

/**
 * @desc    Get all orders belonging to a specific customer
 * @route   GET /api/customer/:customerId/orders
 * @access  Customer
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });

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
 * @route   POST /api/customer/:customerId/orders
 * @access  Customer
 */
exports.createCustomerOrder = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { garmentType, garment, quantity, serviceType, price } = req.body;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}`;

    // Generate tracking URL (this should match your frontend track.html location)
    const trackUrl = `${process.env.FRONTEND_URL}/public/track.html?order=${orderNumber}`;

    // Generate QR code image
    const qrCode = await QRCode.toDataURL(trackUrl);

    // Save order
    const newOrder = await Order.create({
      customerId,
      orderNumber,
      garmentType,
      garment,
      quantity,
      serviceType,
      price,
      qrCode,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("❌ Error creating customer order:", error);
    res.status(500).json({ message: "Server error while creating order." });
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
 * @route   GET /api/customer/:customerId/payments
 * @access  Customer
 */
exports.getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;
    const payments = await Payment.find({ customerId }).sort({ date: -1 });

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
 * @route   GET /api/customer/:customerId/profile
 * @access  Customer
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const user = await User.findById(customerId).select("-password");

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
 * @desc    Update customer profile (phone, email, name)
 * @route   PUT /api/customer/:customerId/profile
 * @access  Customer
 */
exports.updateCustomerProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fullname, phone, email } = req.body;

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: "Customer not found." });
    }

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
 * @route   GET /api/customer/:customerId/summary
 * @access  Customer
 */
exports.getCustomerDashboardSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [received, inProgress, completed, pendingPayments] = await Promise.all([
      Order.countDocuments({ customerId, status: "Received" }),
      Order.countDocuments({ customerId, status: "In Progress" }),
      Order.countDocuments({ customerId, status: "Completed" }),
      Order.countDocuments({ customerId, paymentStatus: "Pending" }),
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
