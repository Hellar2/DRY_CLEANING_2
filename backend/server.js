const express = require('express');
const cors = require('cors');
const app = express();

// =======================
// Route Imports
// =======================
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const staffRoutes = require("./routes/staffRoutes");
const orderRoutes = require("./routes/orderRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// =======================
// API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
