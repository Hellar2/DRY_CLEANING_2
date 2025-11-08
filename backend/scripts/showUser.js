const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run(){
  try{
    await mongoose.connect(process.env.MONGO_URI);
    const u = await User.findOne({ email: 'trylogin@example.com' }).lean();
    console.log(u);
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
}
run();
