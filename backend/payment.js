// payment.js — Backend routes for Payment History

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// ✅ Payment Schema & Model
const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' }
});

const Payment = mongoose.model('Payment', paymentSchema);

// ✅ ROUTES

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error });
  }
});

// Get a specific payment by order ID
router.get('/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error });
  }
});

// Add a new payment
router.post('/', async (req, res) => {
  const { orderId, amount, status } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ message: 'Order ID and amount are required' });
  }

  try {
    const newPayment = new Payment({ orderId, amount, status: status || 'Paid' });
    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ message: 'Error saving payment', error });
  }
});

// Delete payment (optional)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error });
  }
});

module.exports = router;
