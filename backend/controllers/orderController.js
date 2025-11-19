const Order = require("../models/Order");
const User = require("../models/User");
const QRCode = require("qrcode");

// ===========================
// CUSTOMER FUNCTIONS
// ===========================

// Get customer's own orders only
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    
    const orders = await Order.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate('staffId', 'fullname email');
    
    res.json({
      orders: orders,
      totalOrders: orders.length
    });
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create order (customer or staff)
exports.createOrder = async (req, res) => {
  try {
    const { userId, garmentType, garment, quantity, serviceType, price, totalAmount, items, pickupDate } = req.body;
    
    // Validate required fields
    if (!userId || !garmentType || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Auto-generate order number
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let nextOrderNumber = "ORD-0001";

    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.split("-")[1]);
      nextOrderNumber = `ORD-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // Generate QR code for order tracking
    const qrCode = await QRCode.toDataURL(nextOrderNumber);

    const newOrder = await Order.create({
      userId: userId,
      staffId: req.userId, // Staff who created the order
      orderNumber: nextOrderNumber,
      garmentType,
      garment,
      quantity: quantity || 1,
      serviceType: serviceType || "Standard",
      price: price || 0,
      totalAmount: totalAmount || price || 0,
      items: items || [],
      pickupDate: pickupDate,
      qrCode,
      status: "Received",
      paymentStatus: "Pending"
    });

    res.status(201).json({ 
      message: "Order created successfully", 
      order: newOrder 
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ===========================
// STAFF FUNCTIONS
// ===========================

// Get all orders (staff can see all)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullname email phone')
      .populate('staffId', 'fullname email');
    
    res.json({
      orders: orders,
      totalOrders: orders.length
    });
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update order status (staff only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Track status change for customer stats
    const oldStatus = order.status;
    
    // Update fields
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    
    // Update staff who modified the order
    order.staffId = req.userId;
    
    await order.save();
    
    // Update customer stats if order changed to/from Completed
    if (order.userId && oldStatus !== status) {
      const Customer = require('../models/customer');
      const statusChange = {};
      
      if (oldStatus !== 'Completed' && status === 'Completed') {
        // Order completed: decrement active, increment completed
        statusChange['$inc'] = {
          'stats.activeOrders': -1,
          'stats.completedOrders': 1
        };
      } else if (oldStatus === 'Completed' && status !== 'Completed') {
        // Order un-completed: increment active, decrement completed
        statusChange['$inc'] = {
          'stats.activeOrders': 1,
          'stats.completedOrders': -1
        };
      }
      
      if (statusChange['$inc']) {
        await Customer.updateOne(
          { userId: order.userId },
          statusChange
        );
        console.log('✅ Customer stats updated for order status change:', orderId);
      }
    }
    
    // Populate for response
    await order.populate('userId', 'fullname email phone');
    await order.populate('staffId', 'fullname email');
    
    res.json({ 
      message: "Order updated successfully", 
      order: order 
    });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Approve order (staff)
exports.approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Move to In Progress
    order.status = "In Progress";
    order.staffId = req.userId;
    
    await order.save();
    await order.populate('userId', 'fullname email phone');
    await order.populate('staffId', 'fullname email');
    
    res.json({ 
      message: "Order approved and in progress", 
      order: order 
    });
  } catch (err) {
    console.error('Error approving order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mark order as ready (staff)
exports.fulfillOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Mark as ready for pickup
    order.status = "Ready for Pickup";
    order.staffId = req.userId;
    
    await order.save();
    await order.populate('userId', 'fullname email phone');
    await order.populate('staffId', 'fullname email');
    
    res.json({ 
      message: "Order fulfilled and ready for pickup", 
      order: order 
    });
  } catch (err) {
    console.error('Error fulfilling order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get order by ID (with role-based access)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'fullname email phone')
      .populate('staffId', 'fullname email');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Customer can only see their own orders
    if (userRole === 'Customer' && order.userId._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json({ order: order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete order (staff/admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByIdAndDelete(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
