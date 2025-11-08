const User = require("../models/User");
const Order = require("../models/Order");
const Customer = require("../models/customer");

// ===========================
// USER MANAGEMENT
// ===========================

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      users: users,
      totalUsers: users.length
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's orders count
    const ordersCount = await Order.countDocuments({ userId: userId });
    
    res.json({
      user: user,
      ordersCount: ordersCount
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Add new user (admin only)
exports.addUser = async (req, res) => {
  try {
    const { fullname, email, phone, password, role } = req.body;
    
    // Validate required fields
    if (!fullname || !email || !phone || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.replace(/\D/g, '') }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email or phone" });
    }
    
    // Create new user (password will be hashed by pre-save hook)
    const newUser = await User.create({
      fullname,
      email: email.toLowerCase().trim(),
      phone: phone.replace(/\D/g, ''),
      password: password,
      role: role
    });
    
    // If customer, create customer profile
    if (role === 'Customer') {
      await Customer.create({ userId: newUser._id });
    }
    
    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: "User added successfully",
      user: userResponse
    });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user role/privileges (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['Admin', 'Staff', 'Customer'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const oldRole = user.role;
    user.role = role;
    await user.save();
    
    // If changing to Customer and no customer profile exists, create one
    if (role === 'Customer') {
      const customerExists = await Customer.findOne({ userId: userId });
      if (!customerExists) {
        await Customer.create({ userId: userId });
      }
    }
    
    res.json({
      message: `User role updated from ${oldRole} to ${role}`,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Revoke user access (disable account)
exports.revokeUserAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add isActive field to user schema or use a different approach
    // For now, we'll change their role to indicate revoked access
    user.role = `Revoked-${user.role}`;
    await user.save();
    
    res.json({
      message: "User access revoked successfully",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error revoking user access:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete associated customer profile if exists
    await Customer.deleteOne({ userId: userId });
    
    // Delete user's orders (optional - you might want to keep them for records)
    // await Order.deleteMany({ userId: userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.json({
      message: "User deleted successfully",
      deletedUser: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get dashboard statistics (admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalStaff = await User.countDocuments({ role: 'Staff' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Received' });
    const inProgressOrders = await Order.countDocuments({ status: 'In Progress' });
    const completedOrders = await Order.countDocuments({ status: { $in: ['Completed', 'Picked Up'] } });
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    res.json({
      users: {
        total: totalUsers,
        customers: totalCustomers,
        staff: totalStaff,
        admins: totalAdmins
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inProgress: inProgressOrders,
        completed: completedOrders
      },
      revenue: {
        total: totalRevenue
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = exports;
