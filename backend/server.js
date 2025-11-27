const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// =======================
// Middleware
// =======================
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5002',
  'http://127.0.0.1:5002',
  'http://127.0.0.1:5501',
  'http://localhost:5501'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.error('CORS Error:', msg, 'Origin:', origin);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// 1. Parse JSON and urlencoded data first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Set up CORS
app.use(cors(corsOptions));

// 3. Security headers
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; " +
    "connect-src 'self' http://localhost:5002 ws://localhost:* wss://localhost:*; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
  );
  next();
});

// 4. API Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const staffRoutes = require("./routes/staffRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 5. Serve static files from frontend
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// 6. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 7. Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// 8. Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 9. Handle all other routes
app.get('*', (req, res) => {
  const filePath = path.join(frontendPath, req.path);
  
  // If the requested file exists, serve it
  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    return res.sendFile(filePath);
  }
  
  // Otherwise, serve login.html
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// =======================
// Database Connection
// =======================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drycleanerDB';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// =======================
// Server Listener
// =======================
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Access login at: http://localhost:${PORT}/login.html`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
});
