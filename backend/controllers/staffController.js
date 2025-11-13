const Order = require("../models/Order");
const User = require("../models/User");
const QRCode = require('qrcode');

// Generate QR Code as Data URL
async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
}

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Get dashboard summary statistics
exports.getSummary = async (req, res) => {
  try {
    console.log('📊 Fetching summary statistics...');
    const total = await Order.countDocuments();
    const received = await Order.countDocuments({ status: 'Received' });
    const inProgress = await Order.countDocuments({ status: 'In Progress' });
    const completed = await Order.countDocuments({ status: 'Completed' });
    const ready = await Order.countDocuments({ status: 'Ready for Pickup' });

    console.log('✅ Summary stats:', { total, received, inProgress, completed, ready });

    res.json({
      total,
      received,
      inProgress,
      completed,
      ready
    });
  } catch (err) {
    console.error('❌ Summary error:', err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

// Search customers by name or email
exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const customers = await User.find({
      role: 'Customer',
      $or: [
        { fullname: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('fullname email phone')
    .limit(10);

    res.json(customers);
  } catch (err) {
    console.error('Customer search error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Fetch all orders for staff
exports.staffGetOrders = async (req, res) => {
  try {
    console.log('📦 Fetching orders for staff...');
    const orders = await Order.find()
      .populate("userId", "fullname email phone")
      .populate("staffId", "fullname")
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error('❌ Get orders error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

// Create a new order (register garment)
exports.staffCreateOrder = async (req, res) => {
  try {
    const { userId, customerEmail, garmentType, quantity, serviceType, price, orderNumber } = req.body;
    
    console.log('Creating order with data:', req.body);

    // Validate required fields
    if (!garmentType) {
      return res.status(400).json({ message: "Garment type is required" });
    }

    // Find or validate customer
    let customerId = userId;
    
    if (!customerId && customerEmail) {
      const customer = await User.findOne({ email: customerEmail.toLowerCase().trim(), role: 'Customer' });
      if (customer) {
        customerId = customer._id;
      }
    }

    if (!customerId) {
      return res.status(400).json({ message: "Customer not found. Please select a valid customer." });
    }

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || generateOrderNumber();

    // Generate QR code
    const qrCodeData = await generateQRCode(finalOrderNumber);
    
    if (!qrCodeData) {
      return res.status(500).json({ message: "Failed to generate QR code" });
    }

    // Get staff ID from authenticated user
    const staffId = req.user?.userId || null;

    // Create order
    const newOrder = await Order.create({
      userId: customerId,
      staffId: staffId,
      orderNumber: finalOrderNumber,
      garmentType: garmentType,
      quantity: quantity || 1,
      serviceType: serviceType || 'Standard',
      price: price || 0,
      totalAmount: price || 0,
      status: "Received",
      paymentStatus: "Pending",
      qrCode: qrCodeData
    });

    console.log('Order created successfully:', newOrder._id);

    // Populate customer data for response
    await newOrder.populate('userId', 'fullname email phone');

    res.status(201).json({ 
      success: true, 
      order: newOrder,
      message: "Order registered successfully"
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update order status/payment
exports.staffUpdateOrder = async (req, res) => {
  const orderId = req.params.id;
  const { status, paymentStatus } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    
    await order.save();

    res.json({ success: true, order, message: "Order updated successfully" });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ message: err.message });
  }
};
