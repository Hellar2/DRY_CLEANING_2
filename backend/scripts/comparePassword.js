const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run(){
  const email = process.argv[2];
  const plain = process.argv[3];
  if(!email || !plain){
    console.error('Usage: node comparePassword.js <email> <plaintextPassword>');
    process.exit(1);
  }

  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', process.env.MONGO_URI);
    const u = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if(!u){
      console.log('User not found for', email);
      process.exit(0);
    }
    console.log('User:', { _id: u._id.toString(), email: u.email, phone: u.phone, role: u.role });
    console.log('Stored password hash:', u.password);
    const ok = await bcrypt.compare(plain, u.password);
    console.log('Password match:', ok);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(2);
  }
}

run();
