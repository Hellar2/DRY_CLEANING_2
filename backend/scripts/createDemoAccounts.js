const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');
const Customer = require('../models/customer');

const DEMO_ACCOUNTS = [
  {
    fullname: 'Admin Demo',
    email: 'admin@dryclean.com',
    phone: '0700000001',
    password: 'admin123',
    role: 'Admin'
  },
  {
    fullname: 'Staff Demo',
    email: 'staff@dryclean.com',
    phone: '0700000002',
    password: 'staff123',
    role: 'Staff'
  },
  {
    fullname: 'Customer Demo',
    email: 'customer@dryclean.com',
    phone: '0700000003',
    password: 'customer123',
    role: 'Customer'
  }
];

async function createDemoAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    for (const account of DEMO_ACCOUNTS) {
      // Check if user already exists
      const existing = await User.findOne({ 
        $or: [
          { email: account.email },
          { phone: account.phone }
        ]
      });

      if (existing) {
        console.log(`⏭️  ${account.role} account already exists: ${account.email}`);
        
        // Update password if needed
        const isMatch = await bcrypt.compare(account.password, existing.password);
        if (!isMatch) {
          existing.password = account.password;
          await existing.save();
          console.log(`   ✅ Password updated to: ${account.password}`);
        }
        continue;
      }

      // Create new user
      const user = await User.create({
        fullname: account.fullname,
        email: account.email,
        phone: account.phone,
        password: account.password,
        role: account.role
      });

      console.log(`✅ Created ${account.role} account:`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);

      // Create Customer entry if role is Customer
      if (account.role === 'Customer') {
        await Customer.create({ userId: user._id });
        console.log(`   ✅ Customer profile created`);
      }
      console.log('');
    }

    console.log('\n🎉 Demo accounts ready!\n');
    console.log('Login credentials:');
    console.log('─────────────────────────────────────');
    DEMO_ACCOUNTS.forEach(acc => {
      console.log(`${acc.role.padEnd(10)} | ${acc.email.padEnd(25)} | ${acc.password}`);
    });
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createDemoAccounts();
