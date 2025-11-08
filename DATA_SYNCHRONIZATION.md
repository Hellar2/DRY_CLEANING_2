# Data Synchronization & Access Control

## Overview

This document describes the complete data synchronization and role-based access control system implemented in the Dry Cleaning Management System.

---

## Role-Based Access Control

### Three User Roles:

1. **Customer** - Can only view their own orders
2. **Staff** - Can view all orders, approve, and fulfill them
3. **Admin** - Full system access, user management

---

## 1. Customer Access

### What Customers Can Do:

✅ **View Own Orders Only**
- Endpoint: `GET /api/orders/my-orders`
- Authentication: Required
- Returns: Only orders where `userId` matches logged-in customer

✅ **View Order Details**
- Endpoint: `GET /api/orders/:orderId`
- Authentication: Required
- Access Control: Can only view if order belongs to them

✅ **Track Order Progress**
- See real-time status updates
- View assigned staff member
- Check payment status
- See pickup date

### What Customers CANNOT Do:

❌ View other customers' orders
❌ Modify order status
❌ Delete orders
❌ Access admin functions

### Customer Order View:

```json
{
  "orders": [
    {
      "_id": "order123",
      "orderNumber": "ORD-0001",
      "garmentType": "Shirt",
      "quantity": 2,
      "status": "In Progress",
      "paymentStatus": "Paid",
      "totalAmount": 300,
      "pickupDate": "2025-11-15",
      "staffId": {
        "fullname": "Peter Omondi",
        "email": "peter.omondi@dryclean.com"
      },
      "createdAt": "2025-11-09"
    }
  ],
  "totalOrders": 1
}
```

---

## 2. Staff Access

### What Staff Can Do:

✅ **View All Orders**
- Endpoint: `GET /api/orders`
- Authentication: Required (Staff/Admin)
- Returns: All orders from all customers

✅ **Create Orders**
- Endpoint: `POST /api/orders`
- Authentication: Required (Staff/Admin)
- Can create orders for any customer

✅ **Approve Orders**
- Endpoint: `PUT /api/orders/:orderId/approve`
- Authentication: Required (Staff/Admin)
- Changes status from "Received" → "In Progress"
- Assigns staff member to order

✅ **Fulfill Orders**
- Endpoint: `PUT /api/orders/:orderId/fulfill`
- Authentication: Required (Staff/Admin)
- Changes status to "Ready for Pickup"
- Notifies customer (future feature)

✅ **Update Order Status**
- Endpoint: `PUT /api/orders/:orderId/status`
- Authentication: Required (Staff/Admin)
- Can update status and payment status

✅ **Delete Orders**
- Endpoint: `DELETE /api/orders/:orderId`
- Authentication: Required (Staff/Admin)

✅ **Scan Customer QR Codes**
- View customer orders via QR scanner
- See customer information
- Track order history

### What Staff CANNOT Do:

❌ Add/remove users
❌ Change user roles
❌ Access admin dashboard
❌ Modify system settings

### Staff Order View:

```json
{
  "orders": [
    {
      "_id": "order123",
      "orderNumber": "ORD-0001",
      "userId": {
        "fullname": "Sarah Johnson",
        "email": "sarah.johnson@email.com",
        "phone": "0712345001"
      },
      "staffId": {
        "fullname": "Peter Omondi",
        "email": "peter.omondi@dryclean.com"
      },
      "garmentType": "Shirt",
      "status": "In Progress",
      "totalAmount": 300
    }
  ],
  "totalOrders": 17
}
```

---

## 3. Admin Access

### What Admins Can Do:

✅ **User Management**

**View All Users:**
- Endpoint: `GET /api/admin/users`
- Returns: All users (password excluded)

**Add New User:**
- Endpoint: `POST /api/admin/users`
- Body: `{ fullname, email, phone, password, role }`
- Creates user with specified role

**Update User Role:**
- Endpoint: `PUT /api/admin/users/:userId/role`
- Body: `{ role: "Admin" | "Staff" | "Customer" }`
- Changes user privileges

**Revoke User Access:**
- Endpoint: `PUT /api/admin/users/:userId/revoke`
- Disables user account

**Delete User:**
- Endpoint: `DELETE /api/admin/users/:userId`
- Permanently removes user
- Deletes associated customer profile
- Keeps order history for records

✅ **Dashboard Statistics**
- Endpoint: `GET /api/admin/dashboard`
- Returns: Complete system statistics

```json
{
  "users": {
    "total": 10,
    "customers": 7,
    "staff": 2,
    "admins": 1
  },
  "orders": {
    "total": 25,
    "pending": 5,
    "inProgress": 8,
    "completed": 12
  },
  "revenue": {
    "total": 15000
  }
}
```

✅ **Full Order Access**
- View all orders
- Modify any order
- Delete orders
- Access order analytics

✅ **System Settings**
- Endpoint: `GET/PUT /api/admin/settings`
- Configure system-wide settings

---

## Order Status Flow

### Status Progression:

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

### Status Visibility:

| Status | Customer Sees | Staff Sees | Admin Sees |
|--------|--------------|------------|------------|
| Received | ✅ Yes | ✅ Yes | ✅ Yes |
| In Progress | ✅ Yes | ✅ Yes | ✅ Yes |
| Ready for Pickup | ✅ Yes | ✅ Yes | ✅ Yes |
| Picked Up | ✅ Yes | ✅ Yes | ✅ Yes |
| Completed | ✅ Yes | ✅ Yes | ✅ Yes |

**Key Point:** Customers see ALL statuses for THEIR orders. They can track progress in real-time.

---

## Authentication & Authorization

### Authentication Flow:

1. User logs in → Receives JWT token
2. Token contains: `userId` and `role`
3. Token sent with every API request
4. Middleware validates token and extracts user info

### Authorization Middleware:

```javascript
// authMiddleware.js
// Validates JWT token
// Adds req.userId and req.userRole

// roleMiddleware.js
// Checks if user has required role
// Example: allowedRoles(["Staff", "Admin"])
```

### Protected Routes:

```javascript
// Customer routes
router.get("/my-orders", 
  authMiddleware, 
  allowedRoles(["Customer"]), 
  orderController.getMyOrders
);

// Staff routes
router.put("/:orderId/approve", 
  authMiddleware, 
  allowedRoles(["Staff", "Admin"]), 
  orderController.approveOrder
);

// Admin routes
router.use(authMiddleware);
router.use(allowedRoles(["Admin"]));
```

---

## Sample Data

### Users Created:

**Customers (5):**
1. Sarah Johnson - sarah.johnson@email.com
2. Michael Chen - michael.chen@email.com
3. Aisha Mohammed - aisha.mohammed@email.com
4. David Kamau - david.kamau@email.com
5. Grace Wanjiru - grace.wanjiru@email.com

**Staff (2):**
1. Peter Omondi - peter.omondi@dryclean.com
2. Lucy Muthoni - lucy.muthoni@dryclean.com

**All passwords:** `customer123` or `staff123`

### Orders Created:

- **Total:** 17 orders
- **Distribution:** 2-5 orders per customer
- **Statuses:** Mixed (Received, In Progress, Ready, Completed, Picked Up)
- **Payment:** ~65% Paid, ~35% Pending
- **Total Revenue:** KSh 5,470

### Garment Types:

- Shirt (KSh 150)
- Pants (KSh 200)
- Dress (KSh 400)
- Suit (KSh 600)
- Jacket (KSh 350)
- Coat (KSh 500)
- Blouse (KSh 180)
- Skirt (KSh 220)
- Tie (KSh 80)
- Scarf (KSh 100)

### Service Types:

- **Standard** - Base price
- **Express** - 1.5x base price
- **Premium** - 2x base price

---

## API Endpoints Summary

### Customer Endpoints:

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/orders/my-orders` | ✅ | Customer | Get own orders |
| GET | `/api/orders/:orderId` | ✅ | Customer | Get order details (own only) |

### Staff Endpoints:

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/orders` | ✅ | Staff/Admin | Get all orders |
| POST | `/api/orders` | ✅ | Staff/Admin | Create order |
| PUT | `/api/orders/:orderId/status` | ✅ | Staff/Admin | Update status |
| PUT | `/api/orders/:orderId/approve` | ✅ | Staff/Admin | Approve order |
| PUT | `/api/orders/:orderId/fulfill` | ✅ | Staff/Admin | Fulfill order |
| DELETE | `/api/orders/:orderId` | ✅ | Staff/Admin | Delete order |

### Admin Endpoints:

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/dashboard` | ✅ | Admin | Get statistics |
| GET | `/api/admin/users` | ✅ | Admin | Get all users |
| GET | `/api/admin/users/:userId` | ✅ | Admin | Get user details |
| POST | `/api/admin/users` | ✅ | Admin | Add new user |
| PUT | `/api/admin/users/:userId/role` | ✅ | Admin | Update user role |
| PUT | `/api/admin/users/:userId/revoke` | ✅ | Admin | Revoke access |
| DELETE | `/api/admin/users/:userId` | ✅ | Admin | Delete user |

---

## Data Synchronization Examples

### Example 1: Customer Views Orders

**Request:**
```bash
GET /api/orders/my-orders
Authorization: Bearer <customer_token>
```

**Response:**
```json
{
  "orders": [
    {
      "_id": "690fc123...",
      "orderNumber": "ORD-0001",
      "garmentType": "Shirt",
      "status": "In Progress",
      "staffId": {
        "fullname": "Peter Omondi"
      }
    }
  ],
  "totalOrders": 3
}
```

**Note:** Only returns orders where `userId` matches the logged-in customer.

---

### Example 2: Staff Approves Order

**Request:**
```bash
PUT /api/orders/690fc123.../approve
Authorization: Bearer <staff_token>
```

**Response:**
```json
{
  "message": "Order approved and in progress",
  "order": {
    "_id": "690fc123...",
    "status": "In Progress",
    "staffId": {
      "fullname": "Peter Omondi"
    },
    "userId": {
      "fullname": "Sarah Johnson"
    }
  }
}
```

**Effect:** 
- Order status changes to "In Progress"
- Staff member assigned to order
- Customer can see updated status immediately

---

### Example 3: Admin Adds New User

**Request:**
```bash
POST /api/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullname": "New Staff Member",
  "email": "newstaff@dryclean.com",
  "phone": "0700000000",
  "password": "staff123",
  "role": "Staff"
}
```

**Response:**
```json
{
  "message": "User added successfully",
  "user": {
    "_id": "690fc456...",
    "fullname": "New Staff Member",
    "email": "newstaff@dryclean.com",
    "role": "Staff"
  }
}
```

---

## Testing the System

### Seed Database:

```bash
cd backend
node scripts/seedRealisticData.js
```

### Test Customer Access:

```bash
# Login as customer
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"sarah.johnson@email.com","password":"customer123"}'

# Get token from response, then:
curl -X GET http://localhost:5002/api/orders/my-orders \
  -H "Authorization: Bearer <token>"
```

### Test Staff Access:

```bash
# Login as staff
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"peter.omondi@dryclean.com","password":"staff123"}'

# Get all orders
curl -X GET http://localhost:5002/api/orders \
  -H "Authorization: Bearer <token>"
```

### Test Admin Access:

```bash
# Login as admin
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@dryclean.com","password":"admin123"}'

# Get dashboard stats
curl -X GET http://localhost:5002/api/admin/dashboard \
  -H "Authorization: Bearer <token>"
```

---

## Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - bcrypt with salt rounds  
✅ **Role-Based Access** - Middleware enforces permissions  
✅ **Data Isolation** - Customers see only their data  
✅ **Input Validation** - Required fields checked  
✅ **Error Handling** - Proper error messages  

---

## Summary

### Customer:
- ✅ View own orders only
- ✅ Track order progress
- ✅ See assigned staff
- ❌ Cannot see other customers' orders

### Staff:
- ✅ View all orders
- ✅ Approve orders (Received → In Progress)
- ✅ Fulfill orders (In Progress → Ready for Pickup)
- ✅ Update order status
- ❌ Cannot manage users

### Admin:
- ✅ Add users
- ✅ Revoke user access
- ✅ Remove users
- ✅ Change user roles
- ✅ View system statistics
- ✅ Full system access

**Data is properly synchronized and access-controlled based on user roles!** 🎉
