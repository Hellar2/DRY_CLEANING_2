const Order = require("../models/Order");
const QRCode = require("qrcode");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { garmentType, quantity, serviceType, price } = req.body;

    if (!garmentType || !quantity || !serviceType || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Auto-generate order number
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let nextOrderNumber = "ORD-0001";

    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split("-")[1]);
      nextOrderNumber = `ORD-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // ✅ Generate QR code using order number
    const qrCode = await QRCode.toDataURL(nextOrderNumber);

    const newOrder = await Order.create({
      orderNumber: nextOrderNumber,
      garmentType,
      quantity,
      serviceType,
      price,
      qrCode,
      staffId: req.user.id // from authMiddleware
    });

    res.status(201).json({ message: "Order created successfully", order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Other order functions (optional):
// - getAllOrders
// - getStaffOrders
// - updateOrderStatus
