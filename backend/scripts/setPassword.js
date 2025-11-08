const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run(){
  const email = process.argv[2];
  const newPass = process.argv[3];
  if(!email || !newPass){
    console.error('Usage: node setPassword.js <email> <newPlaintextPassword>');
    process.exit(1);
  }

  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', process.env.MONGO_URI);
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if(!user){
      console.log('User not found for', email);
      process.exit(0);
    }
  // Assign plaintext and let the model pre-save hook hash it once
  user.password = newPass;
    await user.save();
    console.log('Password updated for', email);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(2);
  }
}

run();
