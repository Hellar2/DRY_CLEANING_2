// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  customerId: { type: String, unique: true }, // e.g. CUS123456
  address: { type: String },
  notes: { type: String },
  // Account statistics
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    activeOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate a simple unique customerId before save
customerSchema.pre("save", async function(next) {
  if (this.customerId) return next();

  // Create reasonably unique ID: CUS + 6 digits
  const rand = () => Math.floor(100000 + Math.random() * 900000);
  this.customerId = `CUS${rand()}`;

  // ensure uniqueness (loop until unique) - use mongoose.models to avoid overwrite issues
  const Customer = mongoose.models.Customer || mongoose.model("Customer");
  let exists = await Customer.findOne({ customerId: this.customerId });
  while (exists) {
    this.customerId = `CUS${rand()}`;
    exists = await Customer.findOne({ customerId: this.customerId });
  }
  next();
});

// Prevent OverwriteModelError when server reloads
module.exports = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
