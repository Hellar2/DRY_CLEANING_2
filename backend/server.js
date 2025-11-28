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
// Allow all origins in development for easier testing
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'http://your-production-domain.com',
      'https://your-production-domain.com'
    ]
  : ['*']; // Allow all origins in development

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Allowing CORS for origin: ${origin || 'no origin'}`);
      return callback(null, true);
    }

    // In production, only allow specific origins
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    console.error('CORS Error:', msg);
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// 1. Parse JSON and urlencoded data first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Set up CORS
app.use(cors(corsOptions));

// 3. Security headers
app.use((req, res, next) => {
  // More permissive CSP for development
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader("Content-Security-Policy", 
      `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; ` +
      `connect-src 'self' http://localhost:${process.env.PORT || 5002} ws://localhost:* wss://localhost:* http://127.0.0.1:${process.env.PORT || 5002} https:; ` +
      `font-src 'self' https://fonts.gstatic.com data:; ` +
      `img-src 'self' data: blob:; ` +
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; ` +
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`
    );
  } else {
    // Stricter CSP for production
    res.setHeader("Content-Security-Policy", 
      `default-src 'self'; ` +
      `connect-src 'self' https://dry-cleaning2.vercel.app; ` +
      `font-src 'self' https://fonts.gstatic.com data:; ` +
      `img-src 'self' data:; ` +
      `script-src 'self'; ` +
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`
    );
  }
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
// Network Utilities
// =======================
function getNetworkInterfaces() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const results = [];

  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(details => {
      // Skip internal (non-IPv4) and non-internal (i.e., 127.0.0.1) addresses
      if (details.family === 'IPv4' && !details.internal) {
        results.push({
          name: iface,
          address: details.address,
          netmask: details.netmask,
          mac: details.mac
        });
      }
    });
  });

  return results;
}

// =======================
// Server Listener
// =======================
const PORT = process.env.PORT || 5002;
const HOST = '0.0.0.0';

// Start the server
const server = app.listen(PORT, HOST, () => {
  const networkInterfaces = getNetworkInterfaces();
  
  console.log('\n🌐 Server is running!');
  console.log('=====================');
  console.log(`🏠 Local:            http://localhost:${PORT}`);
  console.log(`🌍 Network:          http://${HOST}:${PORT}`);
  
  // Show network interfaces
  if (networkInterfaces.length > 0) {
    console.log('\n🌍 Network Interfaces:');
    networkInterfaces.forEach((iface, index) => {
      console.log(`   ${index + 1}. ${iface.name}: http://${iface.address}:${PORT}`);
    });
  }
  
  console.log('\n🔗 Important Links:');
  console.log(`   - Login:          http://localhost:${PORT}/login.html`);
  console.log(`   - Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`   - API Test:       http://localhost:${PORT}/api/test`);
  console.log('\n📝 Note: To access from other devices, use your computer\'s IP address instead of localhost');
  console.log('=====================\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log('Try one of these solutions:');
    console.log('1. Use a different port by setting the PORT environment variable');
    console.log('2. Find and stop the process using port', PORT);
    console.log('   On Windows: netstat -ano | findstr :' + PORT);
    console.log('   Then: taskkill /F /PID <PID>');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
