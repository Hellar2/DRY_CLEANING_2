const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function run(){
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).lean();
  console.log('Users in DB:', users.length);
  users.forEach(u=>{
    console.log({ _id: u._id.toString(), fullname: u.fullname, email: u.email, phone: u.phone, role: u.role });
  });
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
