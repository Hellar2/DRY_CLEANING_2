const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true }, // e.g., "m-pesa", "card"
    status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending"
    },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
