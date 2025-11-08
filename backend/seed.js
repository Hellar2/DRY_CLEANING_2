const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const Settings = require("./models/Settings");

mongoose.connect("mongodb://127.0.0.1:27017/drycleaning", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function seed() {
  try {
    await User.deleteMany();
    await Order.deleteMany();
    await Settings.deleteMany();

    await User.insertMany([
      { fullname: "John Mwangi", email: "john@example.co.ke", phone: "+254701234567", role: "Customer", password: "1234" },
      { fullname: "Jane Njeri", email: "jane@example.co.ke", phone: "+254712345678", role: "Staff", password: "1234" },
      { fullname: "Peter Otieno", email: "peter@example.co.ke", phone: "+254723456789", role: "Staff", password: "1234" }
    ]);

   await Order.insertMany([
      {
        staffId: null,
        orderNumber: "ORD001",
        garmentType: "Shirt",
        garment: "White cotton shirt",
        quantity: 2,
        serviceType: "Standard",
        price: 5,
        status: "Received",
        paymentStatus: "Pending",
        qrCode: "QR001"
      },
      {
        staffId: null,
        orderNumber: "ORD002",
        garmentType: "Suit",
        garment: "Black business suit",
        quantity: 1,
        serviceType: "Premium",
        price: 15,
        status: "In Progress",
        paymentStatus: "Pending",
        qrCode: "QR002"
      },
      {
        staffId: null,
        orderNumber: "ORD003",
        garmentType: "Dress",
        garment: "Red evening dress",
        quantity: 1,
        serviceType: "Express",
        price: 12,
        status: "Completed",
        paymentStatus: "Paid",
        qrCode: "QR003"
      }
    ]);

    // ----- Settings -----
    await Settings.create({ siteName: "Dry Clean Pro", adminEmail: "admin@example.com" });

    console.log("✅ Database seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
