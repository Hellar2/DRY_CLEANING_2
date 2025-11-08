const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');
const Order = require('../models/Order');
const Customer = require('../models/customer');
const QRCode = require('qrcode');

// Realistic sample data
const SAMPLE_USERS = [
  // Customers
  {
    fullname: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "0712345001",
    password: "customer123",
    role: "Customer"
  },
  {
    fullname: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "0723456002",
    password: "customer123",
    role: "Customer"
  },
  {
    fullname: "Aisha Mohammed",
    email: "aisha.mohammed@email.com",
    phone: "0734567003",
    password: "customer123",
    role: "Customer"
  },
  {
    fullname: "David Kamau",
    email: "david.kamau@email.com",
    phone: "0745678004",
    password: "customer123",
    role: "Customer"
  },
  {
    fullname: "Grace Wanjiru",
    email: "grace.wanjiru@email.com",
    phone: "0756789005",
    password: "customer123",
    role: "Customer"
  },
  // Staff
  {
    fullname: "Peter Omondi",
    email: "peter.omondi@dryclean.com",
    phone: "0767890006",
    password: "staff123",
    role: "Staff"
  },
  {
    fullname: "Lucy Muthoni",
    email: "lucy.muthoni@dryclean.com",
    phone: "0778901007",
    password: "staff123",
    role: "Staff"
  }
];

const GARMENT_TYPES = [
  { type: "Shirt", price: 150 },
  { type: "Pants", price: 200 },
  { type: "Dress", price: 400 },
  { type: "Suit", price: 600 },
  { type: "Jacket", price: 350 },
  { type: "Coat", price: 500 },
  { type: "Blouse", price: 180 },
  { type: "Skirt", price: 220 },
  { type: "Tie", price: 80 },
  { type: "Scarf", price: 100 }
];

const SERVICE_TYPES = ["Standard", "Express", "Premium"];
const STATUSES = ["Received", "In Progress", "Ready for Pickup", "Completed", "Picked Up"];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

function getPickupDate(createdDate) {
  const pickup = new Date(createdDate);
  pickup.setDate(pickup.getDate() + Math.floor(Math.random() * 5) + 2); // 2-7 days from creation
  return pickup;
}

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({ email: { $regex: /@email\.com|@dryclean\.com/ } });
    await Order.deleteMany({});
    await Customer.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of SAMPLE_USERS) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✅ Created ${user.role}: ${user.fullname} (${user.email})`);
      
      // Create customer profile for customers
      if (user.role === 'Customer') {
        await Customer.create({ userId: user._id });
      }
    }
    
    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Create orders
    console.log('📦 Creating orders...');
    const customers = createdUsers.filter(u => u.role === 'Customer');
    const staff = createdUsers.filter(u => u.role === 'Staff');
    const orders = [];
    let orderCounter = 1;

    for (const customer of customers) {
      // Each customer gets 2-5 orders
      const numOrders = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < numOrders; i++) {
        const garment = getRandomElement(GARMENT_TYPES);
        const quantity = Math.floor(Math.random() * 3) + 1;
        const serviceType = getRandomElement(SERVICE_TYPES);
        const status = getRandomElement(STATUSES);
        const createdAt = getRandomDate(30); // Within last 30 days
        const pickupDate = getPickupDate(createdAt);
        
        // Calculate price based on service type
        let basePrice = garment.price * quantity;
        if (serviceType === "Express") basePrice *= 1.5;
        if (serviceType === "Premium") basePrice *= 2;
        
        const orderNumber = `ORD-${String(orderCounter).padStart(4, '0')}`;
        const qrCode = await QRCode.toDataURL(orderNumber);
        
        const order = await Order.create({
          userId: customer._id,
          staffId: getRandomElement(staff)._id,
          orderNumber: orderNumber,
          garmentType: garment.type,
          garment: `${garment.type} - ${serviceType} service`,
          quantity: quantity,
          serviceType: serviceType,
          price: basePrice,
          totalAmount: basePrice,
          items: [{
            itemType: garment.type,
            quantity: quantity,
            price: garment.price
          }],
          pickupDate: pickupDate,
          status: status,
          paymentStatus: Math.random() > 0.3 ? "Paid" : "Pending",
          qrCode: qrCode,
          createdAt: createdAt
        });
        
        orders.push(order);
        orderCounter++;
      }
    }
    
    console.log(`✅ Created ${orders.length} orders\n`);

    // Display summary
    console.log('📊 Database Seeding Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`Total Users: ${createdUsers.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Staff: ${staff.length}`);
    console.log(`Total Orders: ${orders.length}`);
    console.log('');
    
    console.log('Order Status Distribution:');
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });
    console.log('');
    
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    console.log(`Payment Status:`);
    console.log(`  - Paid: ${paidOrders}`);
    console.log(`  - Pending: ${orders.length - paidOrders}`);
    console.log(`Total Revenue: KSh ${totalRevenue.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Database seeded successfully!\n');
    
    console.log('📝 Sample Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Customer Accounts:');
    SAMPLE_USERS.filter(u => u.role === 'Customer').forEach(u => {
      console.log(`  Email: ${u.email} | Password: ${u.password}`);
    });
    console.log('');
    console.log('Staff Accounts:');
    SAMPLE_USERS.filter(u => u.role === 'Staff').forEach(u => {
      console.log(`  Email: ${u.email} | Password: ${u.password}`);
    });
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
