const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function checkPassword() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node checkUserPassword.js <email> <password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(0);
    }

    console.log('\n📋 User Details:');
    console.log('  Email:', user.email);
    console.log('  Phone:', user.phone);
    console.log('  Role:', user.role);
    console.log('  Password Hash:', user.password);
    console.log('  Hash starts with $2:', user.password.startsWith('$2'));

    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log('\n🔑 Password Check:');
    console.log('  Testing password:', password);
    console.log('  Match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('\n💡 Tip: The password you entered does not match.');
      console.log('   Try the password you used during registration.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPassword();
