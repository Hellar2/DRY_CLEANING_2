const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "Dry Cleaning Service" },
  adminEmail: { type: String, default: "admin@example.com" }
});

module.exports = mongoose.model("Settings", settingsSchema);
