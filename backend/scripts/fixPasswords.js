const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function fixPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (!user.password.startsWith('$2')) {
        console.log(`Hashing password for ${user.email}...`);
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update directly without triggering pre-save hook
        await User.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        console.log(`✅ Password hashed for ${user.email}`);
      } else {
        console.log(`⏭️  Password already hashed for ${user.email}`);
      }
    }

    console.log('\n✅ All passwords fixed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixPasswords();
