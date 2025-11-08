// routes/order.routes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// =====================
// CREATE NEW ORDER
// =====================
router.post("/", async (req, res) => {
    const { customerId, garmentType, garment, quantity, serviceType, price } = req.body;

    if (!customerId || !garmentType) {
        return res.status(400).json({ message: "Customer ID and garment type are required" });
    }

    try {
        const orderNumber = `ORD-${Date.now()}`;
        const qrCode = `QR-${Math.floor(Math.random() * 1000000)}`;

        const newOrder = new Order({
            customerId,
            orderNumber,
            garmentType,
            garment,
            quantity: quantity || 1,
            serviceType: serviceType || "Standard",
            price: price || 0,
            qrCode
        });

        await newOrder.save();
        res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ message: "Server error creating order" });
    }
});

// =====================
// GET ORDERS FOR CUSTOMER
// =====================
router.get("/customer/:customerId", async (req, res) => {
    const { customerId } = req.params;

    try {
        const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Server error fetching orders" });
    }
});

// =====================
// UPDATE ORDER STATUS
// =====================
router.put("/:orderId/status", async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();
        res.json({ message: "Order updated successfully", order });
    } catch (err) {
        console.error("Error updating order:", err);
        res.status(500).json({ message: "Server error updating order" });
    }
});

// =====================
// DELETE ORDER (Optional)
// =====================
router.delete("/:orderId", async (req, res) => {
    const { orderId } = req.params;

    try {
        const deleted = await Order.findByIdAndDelete(orderId);
        if (!deleted) return res.status(404).json({ message: "Order not found" });

        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("Error deleting order:", err);
        res.status(500).json({ message: "Server error deleting order" });
    }
});

module.exports = router;
