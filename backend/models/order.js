const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // staff handling the order
  orderNumber: { type: String, unique: true, required: true }, // unique order identifier
  garmentType: { type: String, required: true }, // type of garment
  garment: { type: String }, // optional description
  quantity: { type: Number, default: 1 }, // quantity of garments
  serviceType: { type: String, default: "Standard" }, // service type
  price: { type: Number, default: 0 }, // price of order
  status: {
    type: String,
    enum: ["Received", "In Progress", "Completed", "Picked Up", "Ready for Pickup"],
    default: "Received"
  }, // current status of order
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending"],
    default: "Pending"
  }, // payment state
  qrCode: { type: String, required: true }, // QR code for tracking
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
