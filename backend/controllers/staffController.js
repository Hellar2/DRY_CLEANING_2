const Order = require("../models/Order");
const User = require("../models/User");

// Fetch all orders for staff
exports.staffGetOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("customerId", "fullname email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new order (register garment)
exports.staffCreateOrder = async (req, res) => {
  const { customerId, garmentType, quantity, serviceType, price } = req.body;
  try {
    const newOrder = new Order({
      customerId,
      garmentType,
      quantity,
      serviceType,
      price,
      status: "Received",
      paymentStatus: "Pending",
      timestamp: new Date()
    });
    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (err) {
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

    // Optional: update customer's embedded order if stored in User.orders
    if (order.customerId) {
      await User.updateOne(
        { _id: order.customerId, "orders._id": order._id },
        { $set: {
          "orders.$.status": status,
          "orders.$.paymentStatus": paymentStatus
        }}
      );
    }

    res.json({ success: true, order, message: "Order updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
