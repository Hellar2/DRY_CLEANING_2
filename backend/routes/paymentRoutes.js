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
        // Check if orderId is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            // Handle local order IDs (from localStorage)
            console.log(`Payment for local order: ${orderId}, Amount: ${amount}`);
            return res.status(200).json({ 
                message: "Payment recorded for local order", 
                orderId,
                amount,
                method,
                status: "Completed",
                note: "This is a local order. Payment recorded in frontend only."
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found in database" });
        }

        // Create Payment Record
        const payment = new Payment({
            orderId,
            customerId: order.userId,
            amount,
            method,
            status: "Completed",
            date: new Date()
        });

        await payment.save();

        // Update Order Payment Status
        order.paymentStatus = "Paid";
        await order.save();

        res.status(201).json({ message: "Payment successful", payment });
    } catch (err) {
        console.error("Error processing payment:", err);
        res.status(500).json({ 
            message: "Server error processing payment",
            error: err.message 
        });
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
