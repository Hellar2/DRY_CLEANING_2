# Dry Cleaning Management System

A comprehensive dry cleaning management system with role-based access control, order tracking, QR code scanning, payment processing, and OTP email verification.

## 🌟 Features

### Core Functionality
- **Multi-Role System**: Admin, Staff, and Customer roles with different permissions
- **Order Management**: Create, track, and manage dry cleaning orders
- **Real-time Updates**: Live order status synchronization
- **QR Code System**: Customer QR codes for quick order lookup
- **Payment Processing**: M-Pesa integration with mobile money payments
- **Email Verification**: OTP-based email verification for profile updates
- **Profile Management**: Complete customer profile system

### User Roles & Permissions

#### 👤 Customer
- View own orders only
- Track order progress in real-time
- Update profile information (with OTP verification for email changes)
- Generate personal QR code for quick scanning
- Make payments via M-Pesa

#### 👥 Staff
- View and manage all customer orders
- Approve orders (Received → In Progress)
- Fulfill orders (In Progress → Ready for Pickup)
- Update order status and payment information
- Scan customer QR codes for instant order lookup
- Create new orders for customers

#### 👨‍💼 Admin
- Full system access and user management
- Add, update, and remove users
- Change user roles and permissions
- View system statistics and analytics
- Manage all orders and payments
- Configure system settings

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Gmail account for email verification

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DRY-CLEANING-2
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Set up environment variables**
Create a `.env` file in the backend directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/dryclean

# Email Configuration (Gmail)
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# JWT Configuration
JWT_SECRET=dryclean-secret-key-2025

# OTP Configuration
OTP_EXPIRATION=10

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=5002
```

4. **Gmail App Password Setup**
   - Enable 2-Step Verification on your Google Account
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Generate and copy the 16-character password
   - Use this password in `EMAIL_PASSWORD` (remove spaces)

5. **Start the backend server**
```bash
npm start
```

6. **Open the frontend**
Open `frontend/login.html` in your web browser

## 🔐 Default Login Credentials

### Admin Accounts
- **Email**: admin@dryclean.com | **Password**: admin123
- **Phone**: 0700123001 | **Password**: admin123

### Staff Accounts
- **Email**: sarah.staff@dryclean.com | **Password**: staff123
- **Phone**: 0710123001 | **Password**: staff123

### Customer Accounts
- **Email**: alice@example.com | **Password**: customer123
- **Phone**: 0720123001 | **Password**: customer123

*You can use either email or phone number as the identifier when logging in.*

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/resend-otp` - Resend OTP for email verification

### Customer Management
- `GET /api/customer/:userId` - Get customer profile
- `PUT /api/customer/:userId` - Update customer profile
- `POST /api/customer/:userId/profile/request-otp` - Request OTP for email change
- `GET /api/customer/:userId/orders` - Get customer orders
- `POST /api/customer/:userId/orders` - Create customer order

### Order Management
- `GET /api/orders` - Get all orders (Staff/Admin)
- `GET /api/orders/my-orders` - Get current user's orders (Customer)
- `PUT /api/orders/:orderId/status` - Update order status
- `PUT /api/orders/:orderId/approve` - Approve order
- `PUT /api/orders/:orderId/fulfill` - Fulfill order
- `DELETE /api/orders/:orderId` - Delete order

### Payment Processing
- `POST /api/payment` - Process payment
- `GET /api/payments` - Get payment history

### Admin Functions
- `GET /api/admin/dashboard` - Get system statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Add new user
- `PUT /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user

## 🔧 Authentication & Security

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Plain passwords are never stored in the database
- Secure password comparison using bcrypt.compare()

### JWT Authentication
- Token-based authentication system
- Tokens contain userId and role information
- Tokens are sent with every API request for authorization

### Role-Based Access Control
- Middleware enforces role-based permissions
- Customers can only access their own data
- Staff can manage orders but not users
- Admins have full system access

### Email Verification (OTP)
- **Purpose**: Email changes in customer profiles only
- **Process**: 6-digit OTP sent to new email address
- **Expiration**: 10 minutes (configurable)
- **Security**: OTP cleared after successful verification

## 📱 QR Code System

### Customer QR Codes
- Each customer gets a unique QR code
- QR code contains customer's userId
- Generated automatically on customer dashboard
- Format: `http://localhost:5002/customer/{userId}/orders`

### Staff QR Scanner
- Camera-based QR code scanning
- Instant popup modal with customer orders
- Scrollable order list with detailed information
- Quick access to customer order history

### Usage
1. Customer logs in and views their QR code
2. Staff scans QR code using the scanner interface
3. Customer orders appear instantly in a popup modal
4. Staff can view order details and status

## 💳 Payment System

### M-Pesa Integration
- Mobile money payments via M-Pesa
- Payment number: **0714788630**
- Step-by-step payment instructions provided
- Order status updated after payment confirmation

### Payment Flow
1. Customer clicks "Pay Now" on completed order
2. M-Pesa payment instructions displayed
3. Customer sends payment to provided number
4. Order marked as paid in system

### Order Status Progression
```
1. Received
   ↓ (Staff approves)
2. In Progress
   ↓ (Staff fulfills)
3. Ready for Pickup
   ↓ (Customer picks up)
4. Picked Up
   ↓ (Marked complete)
5. Completed
```

## 📊 Data Synchronization

### Real-time Updates
- Live order status synchronization across all user interfaces
- Automatic dashboard refresh every 2 seconds
- Consistent data display across multiple devices

### Data Access Control
- **Customers**: See only their own orders and profile data
- **Staff**: See all orders but limited user access
- **Admin**: Full access to all system data

## 🛠️ Technical Architecture

### Backend Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Moment.js** - Date/time handling

### Frontend Technologies
- **HTML5/CSS3** - Structure and styling
- **JavaScript (ES6+)** - Client-side logic
- **QRCode.js** - QR code generation
- **html5-qrcode** - QR code scanning
- **Responsive Design** - Mobile-friendly interface

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  fullname: String,
  email: String,
  phone: String,
  password: String, // Hashed
  role: String, // "Admin", "Staff", "Customer"
  verificationCode: String, // For OTP
  verificationCodeExpires: Date,
  createdAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String,
  userId: ObjectId,
  garmentType: String,
  items: Array,
  quantity: Number,
  serviceType: String,
  price: Number,
  totalAmount: Number,
  status: String, // "Received", "In Progress", "Ready for Pickup", "Completed"
  paymentStatus: String, // "Pending", "Paid"
  staffId: ObjectId,
  pickupDate: Date,
  qrCode: String,
  createdAt: Date
}
```

## 🎨 User Interface

### Dashboard Pages
- **Admin Dashboard**: System overview, user management, analytics
- **Staff Dashboard**: Order management, QR scanner, order fulfillment
- **Customer Dashboard**: Profile summary, order tracking, QR code display

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization
- **Interactive Elements**: Hover effects, smooth transitions
- **Password Visibility Toggle**: Show/hide password functionality on all password fields
- **Professional Styling**: Modern, clean interface with consistent branding

## 🔍 Testing

### Test Authentication
```bash
# Test login
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@dryclean.com","password":"admin123"}'

# Test registration
curl -X POST http://localhost:5002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullname":"Test User","email":"test@example.com","phone":"0712345678","password":"test123","role":"Customer"}'
```

### Test OTP Functionality
```bash
# Request OTP for email change
curl -X POST http://localhost:5002/api/customer/{userId}/profile/request-otp \
  -H "Content-Type: application/json" \
  -d '{"newEmail":"newemail@example.com"}'

# Update profile with OTP
curl -X PUT http://localhost:5002/api/customer/{userId} \
  -H "Content-Type: application/json" \
  -d '{"fullname":"John Doe","email":"newemail@example.com","phone":"0712345678","otp":"123456"}'
```

### Test QR Code API
```bash
# Get customer orders via QR code
curl http://localhost:5002/api/customer/{userId}/orders
```

## 🚨 Troubleshooting

### Common Issues

#### Email Verification Not Working
- **Check Gmail App Password**: Use App Password, not regular password
- **Enable 2-Step Verification**: Required for App Passwords
- **Check Spam Folder**: OTP emails might go to spam
- **Verify .env Configuration**: Ensure EMAIL_USERNAME and EMAIL_PASSWORD are correct

#### Server Not Starting
- **Check MongoDB Connection**: Ensure MongoDB is running
- **Verify Port**: Make sure port 5002 is not in use
- **Check Dependencies**: Run `npm install` in backend directory

#### QR Code Scanner Not Working
- **Allow Camera Permissions**: Browser must have camera access
- **Use HTTPS**: Camera requires secure connection in production
- **Check Browser Compatibility**: Modern browsers recommended

#### Payment Issues
- **Verify M-Pesa Number**: Ensure correct payment number is displayed
- **Check Order Status**: Only completed orders show payment option
- **Backend Server**: Ensure server is running on port 5002

### Error Messages

#### "Invalid OTP"
- OTP has expired (10-minute timeout)
- Incorrect OTP entered
- Request new OTP if needed

#### "Payment Failed"
- Check if order is in "Completed" status
- Verify backend server is running
- Check network connectivity

#### "User not found"
- Verify user exists in database
- Check email/phone format
- Ensure correct login credentials

## 🔒 Security Considerations

### Implemented Security Measures
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Input validation and sanitization
- ✅ OTP expiration for email verification
- ✅ CORS configuration for localhost
- ✅ Environment variable protection

### Production Recommendations
- 🔒 Use HTTPS in production
- 🔒 Implement rate limiting on API endpoints
- 🔒 Add audit logging for sensitive operations
- 🔒 Use dedicated email service (SendGrid, Mailgun)
- 🔒 Implement session timeout
- 🔒 Add CSRF protection
- 🔒 Regular security updates and patches

## 📈 Future Enhancements

### Planned Features
- [ ] SMS OTP verification option
- [ ] Advanced order analytics and reporting
- [ ] Mobile app development
- [ ] Integration with external payment gateways
- [ ] Automated email notifications for order status changes
- [ ] Inventory management system
- [ ] Loyalty program and discounts
- [ ] Multi-location support
- [ ] Advanced user permissions and roles
- [ ] API documentation with Swagger
- [ ] Automated testing suite
- [ ] Docker containerization

### Performance Optimizations
- [ ] Database indexing for faster queries
- [ ] Caching implementation
- [ ] Image optimization for QR codes
- [ ] Lazy loading for large datasets
- [ ] API response compression

## 📞 Support

### Getting Help
- Check this README for common issues
- Review the troubleshooting section
- Verify server logs for error messages
- Test with default credentials first

### Development Team
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Email**: Nodemailer with Gmail SMTP
- **Authentication**: JWT with bcrypt
- **Payments**: M-Pesa integration

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

**Last Updated**: November 2025  
**Version**: 2.0  
**Status**: Production Ready 🚀

For technical support or questions, please refer to the troubleshooting section or check the server logs for detailed error information.
