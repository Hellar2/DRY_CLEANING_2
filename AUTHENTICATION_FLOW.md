# Authentication Flow Documentation

## Complete Authentication Flow

This document describes the exact flow of authentication in the Dry Cleaning Management System.

---

## 1. Registration Flow

### Step-by-Step Process

#### **Frontend (signup.html)**
1. User fills in registration form:
   - Full Name
   - Email
   - Phone
   - Password (plain text)
   - Role (Admin/Staff/Customer)

2. Form data is collected:
```javascript
const userData = {
  fullname: "John Doe",
  email: "john@example.com",
  phone: "0712345678",
  password: "mypassword123",  // Plain text password
  role: "Customer"
};
```

3. Data sent to backend via POST request:
```javascript
fetch("http://localhost:5002/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userData)  // Plain password sent
});
```

#### **Backend (authController.js - register function)**

4. **Receive registration data:**
```javascript
const { fullname, email, phone, password, role } = req.body;
// password is still plain text here
```

5. **Normalize email and phone:**
```javascript
const normEmail = normalizeEmail(email);  // lowercase
const normPhone = normalizePhone(phone);  // digits only
```

6. **Check if user already exists:**
```javascript
const existingUser = await User.findOne({
  $or: [
    { email: normEmail },
    { phone: normPhone }
  ]
});

if (existingUser) {
  return res.status(400).json({ message: "User already exists" });
}
```

7. **Create user with plain password:**
```javascript
const user = await User.create({ 
  fullname, 
  email: normEmail, 
  phone: normPhone, 
  password: password,  // Plain password - will be hashed by model
  role: role || "Customer" 
});
```

#### **Database (User.js model - pre-save hook)**

8. **Automatic password hashing before saving:**
```javascript
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);  // Hash with salt rounds 10
  next();
});
```

9. **Password is now hashed in database:**
```
Original: "mypassword123"
Hashed:   "$2a$10$abcd1234...xyz7890"  // Stored in MongoDB
```

10. **Create Customer profile (if role is Customer):**
```javascript
if (role === "Customer") {
  await Customer.create({ userId: user._id });
}
```

11. **Generate JWT token:**
```javascript
const token = generateToken({ userId: user._id, role: user.role });
```

12. **Send response to frontend:**
```javascript
res.status(201).json({
  message: "Registered",
  token: "jwt_token_here",
  userId: user._id,
  role: user.role,
  fullname: user.fullname
});
```

---

## 2. Login Flow

### Step-by-Step Process

#### **Frontend (login.html)**

1. User enters credentials:
   - Email or Phone
   - Password (plain text)

2. Data collected and sent:
```javascript
const loginData = {
  identifier: "john@example.com",  // Can be email or phone
  password: "mypassword123"         // Plain text password
};

fetch("http://localhost:5002/api/auth/login", {
  method: "POST",
  body: JSON.stringify(loginData)
});
```

#### **Backend (authController.js - login function)**

3. **Receive login credentials:**
```javascript
const { identifier, password } = req.body;
// identifier: "john@example.com"
// password: "mypassword123" (plain text)
```

4. **Normalize identifier:**
```javascript
const id = identifier.trim();
const idEmail = id.includes('@') ? normalizeEmail(id) : null;
const idPhone = normalizePhone(id);
```

5. **Query database for user:**
```javascript
const user = await User.findOne({
  $or: [
    { email: idEmail },  // If identifier is email
    { phone: idPhone }   // If identifier is phone
  ]
});
```

6. **Check if user exists:**
```javascript
if (!user) {
  return res.status(401).json({ message: "Invalid credentials" });
}
```

7. **Verify password using bcrypt.compare:**
```javascript
const isMatch = await bcrypt.compare(password, user.password);
// Compares: "mypassword123" (plain) with "$2a$10$abcd..." (hashed)
// Returns: true or false
```

8. **Check password match:**
```javascript
if (!isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}
```

9. **Generate JWT token:**
```javascript
const token = generateToken({ userId: user._id, role: user.role });
```

10. **Send success response:**
```javascript
res.json({
  message: "Login successful",
  token: "jwt_token_here",
  userId: user._id,
  role: user.role,        // Role from database
  fullname: user.fullname
});
```

#### **Frontend (login.html) - Redirect**

11. **Store session data:**
```javascript
localStorage.setItem('userId', data.userId);
localStorage.setItem('role', data.role);
localStorage.setItem('fullname', data.fullname);
```

12. **Redirect based on role:**
```javascript
const role = data.role.toLowerCase();

if (role === 'admin') {
  window.location.href = './admindashboard.html';
} else if (role === 'staff') {
  window.location.href = './staff-Dashboard.html';
} else {
  window.location.href = './cdashboard.html';  // Customer
}
```

---

## 3. Role Assignment

### Email-Role Relationship

The **role is directly tied to the user account** in the database, not automatically determined by email.

#### During Registration:
```javascript
// User selects role during signup
const user = await User.create({ 
  email: "user@example.com",
  role: "Customer"  // Explicitly set during registration
});
```

#### Role Storage in Database:
```javascript
// MongoDB User document
{
  _id: ObjectId("..."),
  fullname: "John Doe",
  email: "john@example.com",
  phone: "0712345678",
  password: "$2a$10$hashed...",
  role: "Customer",  // Stored in database
  createdAt: ISODate("...")
}
```

#### During Login:
```javascript
// Role is retrieved from database
const user = await User.findOne({ email: "john@example.com" });
// user.role = "Customer" (from database)

// Role sent to frontend
res.json({
  role: user.role  // "Customer", "Staff", or "Admin"
});
```

### Role Types:
- **Admin** - Full system access
- **Staff** - Order management, customer service
- **Customer** - Place orders, track orders

---

## 4. Password Security

### Hashing Process:

1. **Registration:**
   ```
   Plain Password → bcrypt.hash(password, 10) → Hashed Password → Database
   "mypass123"   →  bcrypt hashing         →  "$2a$10$..."    →  MongoDB
   ```

2. **Login:**
   ```
   Plain Password → bcrypt.compare(plain, hashed) → true/false
   "mypass123"   →  compare with DB hash        →  Match?
   ```

### Security Features:
- ✅ Passwords never stored in plain text
- ✅ bcrypt with 10 salt rounds
- ✅ One-way hashing (cannot be reversed)
- ✅ Each password has unique salt
- ✅ Secure comparison using bcrypt.compare

---

## 5. Complete Flow Diagram

```
REGISTRATION:
┌─────────────┐
│   Frontend  │ Plain password
│ signup.html │────────────────┐
└─────────────┘                │
                               ▼
                    ┌──────────────────┐
                    │ authController   │
                    │   register()     │
                    └────────┬─────────┘
                             │ Plain password
                             ▼
                    ┌──────────────────┐
                    │  User Model      │
                    │  pre-save hook   │
                    │  bcrypt.hash()   │
                    └────────┬─────────┘
                             │ Hashed password
                             ▼
                    ┌──────────────────┐
                    │    MongoDB       │
                    │  Store hashed    │
                    │  password + role │
                    └──────────────────┘

LOGIN:
┌─────────────┐
│   Frontend  │ Plain password
│  login.html │────────────────┐
└─────────────┘                │
                               ▼
                    ┌──────────────────┐
                    │ authController   │
                    │    login()       │
                    └────────┬─────────┘
                             │ Query user
                             ▼
                    ┌──────────────────┐
                    │    MongoDB       │
                    │  Get user with   │
                    │  hashed password │
                    └────────┬─────────┘
                             │ User data
                             ▼
                    ┌──────────────────┐
                    │ bcrypt.compare() │
                    │ plain vs hashed  │
                    └────────┬─────────┘
                             │ Match?
                             ▼
                    ┌──────────────────┐
                    │  Generate JWT    │
                    │  Return role     │
                    └────────┬─────────┘
                             │ Token + Role
                             ▼
                    ┌──────────────────┐
                    │   Frontend       │
                    │ Redirect by role │
                    └──────────────────┘
```

---

## 6. Key Points

### ✅ Correct Implementation:

1. **Registration:**
   - Plain password sent from frontend
   - Password hashed by User model pre-save hook
   - Hashed password stored in database
   - Role explicitly set during registration

2. **Login:**
   - Plain password sent from frontend
   - User queried from database by email/phone
   - bcrypt.compare() verifies plain vs hashed
   - Role retrieved from database
   - User redirected based on role

3. **Role Management:**
   - Role stored in database with user account
   - Role set during registration
   - Role retrieved during login
   - Frontend redirects based on role

### ❌ What NOT to Do:

- ❌ Don't hash password twice (manual + pre-save hook)
- ❌ Don't store plain passwords in database
- ❌ Don't send hashed passwords from frontend
- ❌ Don't determine role from email pattern
- ❌ Don't hardcode roles in frontend

---

## 7. Testing the Flow

### Test Registration:
```bash
# Send registration request
curl -X POST http://localhost:5002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Test User",
    "email": "test@example.com",
    "phone": "0712345678",
    "password": "testpass123",
    "role": "Customer"
  }'

# Check database
node backend/scripts/listUsers.js

# Verify password is hashed
node backend/scripts/checkUserPassword.js test@example.com testpass123
```

### Test Login:
```bash
# Send login request
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "testpass123"
  }'

# Should return token and role
```

---

## 8. Files Involved

| File | Purpose |
|------|---------|
| `frontend/signup.html` | Registration form |
| `frontend/login.html` | Login form |
| `backend/controllers/authController.js` | Registration & login logic |
| `backend/models/User.js` | User schema & password hashing |
| `backend/routes/authRoutes.js` | API routes |

---

## Summary

✅ **Registration:** Plain password → Hashed by model → Stored in DB  
✅ **Login:** Plain password → Compared with hashed → Verified  
✅ **Role:** Stored in DB → Retrieved on login → Used for redirect  

The flow is **secure, efficient, and follows best practices**! 🔐
