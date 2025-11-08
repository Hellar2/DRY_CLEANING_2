// routes/payment.routes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Payment = require("../models/Payment"); // We'll create this model

// =====================
// CREATE PAYMENT (Customer pays for order)
// =====================
router.post("/", async (req, res) => {
    const { orderId, amount, method } = req.body;

    if (!orderId || !amount || !method) {
        return res.status(400).json({ message: "Order ID, amount, and payment method are required" });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Create Payment Record
        const payment = new Payment({
            orderId,
            customerId: order.customerId,
            amount,
            method,
            status: "Completed", // default to completed after payment
            date: new Date()
        });

        await payment.save();

        // Update Order Payment Status
        order.paymentStatus = "Paid";
        await order.save();

        res.status(201).json({ message: "Payment successful", payment });
    } catch (err) {
        console.error("Error processing payment:", err);
        res.status(500).json({ message: "Server error processing payment" });
    }
});

// =====================
// GET PAYMENTS FOR CUSTOMER
// =====================
router.get("/customer/:customerId", async (req, res) => {
    const { customerId } = req.params;

    try {
        const payments = await Payment.find({ customerId }).sort({ date: -1 });
        res.json(payments);
    } catch (err) {
        console.error("Error fetching payments:", err);
        res.status(500).json({ message: "Server error fetching payments" });
    }
});

module.exports = router;
