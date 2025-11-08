# Test Credentials for Dry Cleaning System

## 🎯 Quick Start

The database has been seeded with fresh test data. All passwords are properly hashed using bcrypt.

---

## 📋 Login Credentials

### 👤 Admin Users
**Test admin accounts for managing the system**

| Email | Phone | Password | Role |
|-------|-------|----------|------|
| admin@dryclean.com | 0700123001 | `admin123` | Admin |
| john.admin@dryclean.com | 0700123002 | `admin123` | Admin |

---

### 👔 Staff Users
**Test staff accounts for order management**

| Email | Phone | Password | Role |
|-------|-------|----------|------|
| sarah.staff@dryclean.com | 0710123001 | `staff123` | Staff |
| mike.staff@dryclean.com | 0710123002 | `staff123` | Staff |
| emma.staff@dryclean.com | 0710123003 | `staff123` | Staff |

---

### 👨‍👩‍👧 Customer Users
**Test customer accounts with sample orders and payments**

| Email | Phone | Password | Role |
|-------|-------|----------|------|
| alice@example.com | 0720123001 | `customer123` | Customer |
| bob@example.com | 0720123002 | `customer123` | Customer |
| charlie@example.com | 0720123003 | `customer123` | Customer |
| diana@example.com | 0720123004 | `customer123` | Customer |
| eve@example.com | 0720123005 | `customer123` | Customer |

---

## 🧪 Testing Scenarios

### Login Test
1. Go to `http://localhost:5002/login.html`
2. Enter any email/phone from above with its password
3. You should be redirected to the appropriate dashboard:
   - **Admin** → `admindashboard.html`
   - **Staff** → `staff-Dashboard.html`
   - **Customer** → `customerDashboard.html`

### Registration Test
1. Go to `http://localhost:5002/signup.html`
2. Fill in all fields and select a role
3. Submit the form
4. You should be redirected to `login.html`
5. Log in with the new credentials

### Payment History Test
1. Log in as a customer (e.g., `alice@example.com`)
2. Navigate to "Payment History" in the sidebar
3. You should see payment records for completed orders

---

## 🔄 Resetting the Database

If you need to reset the database with fresh test data:

```bash
cd backend
node scripts/seedDatabase.js
```

This will:
1. Drop all old indexes (handled automatically)
2. Clear all existing data
3. Create 10 test users (2 Admin, 3 Staff, 5 Customer)
4. Generate sample orders and payments for customers

---

## 📊 Sample Data

### Orders
- Each customer has 3-5 orders with varying statuses
- Orders include different garment types and services
- Some orders are paid, some are pending

### Payments
- Payments are linked to completed orders
- Payment methods: Cash, M-Pesa, Card
- All payments have "Completed" status

---

## 🔧 Troubleshooting

### Can't Login?
1. Make sure the backend server is running on port 5002
2. Check that MongoDB is running
3. Verify you're using the correct email/phone format
4. Try resetting the database with the seed script

### Backend Not Starting?
1. Check that MongoDB is running: `mongod`
2. Verify `.env` file has correct `MONGO_URI`
3. Run `npm install` in the backend directory
4. Check for port conflicts on 5002

---

## 📝 Notes

- All passwords are stored as bcrypt hashes (secure)
- Customer profiles are automatically created for Customer users
- Orders and payments are randomly generated for demonstration
- Data persists in MongoDB until you reset it

---

## ⚙️ How Authentication Works

**Important**: The system uses a **dataset-based authentication** approach:

1. **Registration**: New users are saved to both:
   - JSON dataset file (`backend/config/usersDataset.json`)
   - MongoDB database (for orders, payments, etc.)

2. **Login**: Credentials are verified from:
   - **Primary**: JSON dataset file (faster, no DB query)
   - **Secondary**: MongoDB (to get user ID for sessions)

3. **Reset Password**: Updates both dataset and database

This hybrid approach ensures fast authentication while maintaining data consistency across the system.

---

**Last Updated**: Dataset-based authentication system configured and ready!

