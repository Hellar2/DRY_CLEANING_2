require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUser(identifier) {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drycleanerDB');
        console.log('Connected to MongoDB');

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            console.log('No user found with identifier:', identifier);
            return;
        }

        console.log('User found:', {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            passwordHash: user.password.substring(0, 20) + '...' // Show part of hash for verification
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

// Get identifier from command line
const identifier = process.argv[2];
if (!identifier) {
    console.log('Usage: node checkUser.js <email_or_phone>');
    process.exit(1);
}

checkUser(identifier);