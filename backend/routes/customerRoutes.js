// ===========================
// QR Code Route - Public Order View
// ===========================
const express = require('express');
const router = express.Router();

router.get("/:username/orders", async (req, res) => {
  try {
    const username = req.params.username;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send(`<h2>User not found</h2>`);
    }

    // Fetch user's orders
    const orders = await Order.find({ customerId: user._id }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.send(`
        <h2>No Orders Found for ${username}</h2>
        <p>This customer has not placed any orders yet.</p>
      `);
    }

    // Build HTML response
    let html = `
      <div style="font-family:Arial, sans-serif; padding:20px;">
        <h1 style="color:#333;">${username}'s Orders</h1>
        <ul style="list-style-type:none; padding:0;">
    `;

    orders.forEach(order => {
      html += `
        <li style="margin-bottom:12px; padding:10px; border:1px solid #ddd; border-radius:8px;">
          <strong>Order ID:</strong> ${order._id}<br>
          <strong>Status:</strong> ${order.status}<br>
          <strong>Total:</strong> KES ${order.price}<br>
          <strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}
        </li>
      `;
    });

    html += `
        </ul>
      </div>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<h2>Server Error</h2><p>${err.message}</p>`);
  }
});

module.exports = router;
