# Demo Accounts - Quick Login Guide

## 🚀 One-Click Demo Login

The login page now features **Quick Demo Login** buttons for instant access to different user roles.

### How to Use

1. Go to the login page
2. Click one of the three demo buttons:
   - **👨‍💼 Admin** - Full system access
   - **👥 Staff** - Staff dashboard and order management
   - **👤 Customer** - Customer dashboard and order tracking

The credentials will be automatically filled in and you'll be logged in immediately!

---

## 📋 Demo Account Credentials

### Admin Account
```
Email:    admin@dryclean.com
Password: admin123
Role:     Admin
```
**Access:** Full system administration, user management, settings, reports

### Staff Account
```
Email:    staff@dryclean.com
Password: staff123
Role:     Staff
```
**Access:** Order management, customer service, order status updates

### Customer Account
```
Email:    customer@dryclean.com
Password: customer123
Role:     Customer
```
**Access:** Place orders, track orders, view history, make payments

---

## 🎯 Features

### Quick Demo Login Buttons
- **Instant Access:** One-click login without typing credentials
- **Visual Indicators:** Color-coded buttons for each role
  - 🔴 Red for Admin
  - 🔵 Blue for Staff
  - 🟢 Green for Customer
- **Loading States:** Buttons show "Logging in..." during authentication
- **Hover Effects:** Smooth animations on hover

### Security
- Credentials are hardcoded in the frontend for demo purposes only
- Passwords are properly hashed in the database using bcrypt
- JWT tokens are generated for session management
- All API calls are authenticated

---

## 🔧 Technical Details

### Demo Accounts Creation
Demo accounts are created using the script:
```bash
cd backend
node scripts/createDemoAccounts.js
```

This script:
- Creates three dedicated demo accounts
- Hashes passwords with bcrypt
- Creates Customer profile for customer account
- Updates existing accounts if they already exist

### Hardcoded Credentials Location
Frontend: `frontend/login.html`
```javascript
const DEMO_ACCOUNTS = {
  admin: {
    identifier: 'admin@dryclean.com',
    password: 'admin123'
  },
  staff: {
    identifier: 'staff@dryclean.com',
    password: 'staff123'
  },
  customer: {
    identifier: 'customer@dryclean.com',
    password: 'customer123'
  }
};
```

---

## 📊 User Roles & Permissions

### Admin
- View all users
- Manage orders
- Access settings
- View dashboard statistics
- Delete/Edit users
- System configuration

### Staff
- View assigned orders
- Update order status
- Register new orders
- Customer service
- Order tracking

### Customer
- Place new orders
- Track order status
- View order history
- Make payments
- Update profile
- View QR codes

---

## 🧪 Testing Workflow

### Test Admin Features
1. Click **👨‍💼 Admin** button
2. Access admin dashboard
3. Test user management
4. View system settings
5. Check reports

### Test Staff Features
1. Click **👥 Staff** button
2. Access staff dashboard
3. Create test order
4. Update order status
5. Test order search

### Test Customer Features
1. Click **👤 Customer** button
2. Access customer dashboard
3. Place new order
4. Track order
5. Test payment flow

---

## 🔄 Resetting Demo Accounts

If demo accounts get corrupted or need reset:

```bash
cd backend
node scripts/createDemoAccounts.js
```

This will:
- Keep existing accounts if found
- Update passwords to default values
- Ensure all accounts are properly configured

---

## 📝 Additional Test Accounts

Besides demo accounts, you can also use:

**Customer Accounts:**
- john@example.co.ke / 1234
- test@example.com / test123

**Staff Accounts:**
- jane@example.co.ke / 1234
- peter@example.co.ke / 1234

---

## 💡 Tips

1. **Quick Testing:** Use demo buttons for fastest access
2. **Manual Login:** You can still type credentials manually
3. **View Credentials:** Click "📋 View Test Credentials" link
4. **Forgot Password:** Use reset feature if needed
5. **Multiple Roles:** Test different roles by logging out and using different demo buttons

---

## 🎨 UI Features

- **Responsive Design:** Works on all screen sizes
- **Visual Feedback:** Buttons change on hover/click
- **Loading States:** Clear indication during login
- **Color Coding:** Easy role identification
- **Smooth Animations:** Professional look and feel

---

## 🔐 Security Notes

⚠️ **Important:** These are demo accounts for testing purposes only.

- Do not use in production without changing credentials
- Demo passwords are intentionally simple
- Consider removing demo buttons in production
- Implement proper user registration for production use

---

## 📞 Support

If demo accounts are not working:
1. Check server is running on port 5002
2. Verify MongoDB is connected
3. Run `node scripts/createDemoAccounts.js`
4. Check browser console for errors
5. Review server logs for authentication issues
