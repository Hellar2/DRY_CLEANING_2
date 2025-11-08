# Login Troubleshooting Guide

## Common Issue: "Invalid Credentials" Error

### Why This Happens
You're trying to login with a password that doesn't match what you used during registration.

---

## How to Fix

### Option 1: Use the Correct Password
Remember the password you used when you registered the account and use that to login.

### Option 2: Use Pre-existing Test Accounts
Use one of these accounts that are already in the database:

**Customer Account:**
- Email: `john@example.co.ke`
- Phone: `+254701234567`
- Password: `1234`

**Staff Accounts:**
- Email: `jane@example.co.ke`
- Phone: `+254712345678`
- Password: `1234`

OR

- Email: `peter@example.co.ke`
- Phone: `+254723456789`
- Password: `1234`

### Option 3: Reset Your Password
1. Click "Forgot Password?" on the login page
2. Enter your email or phone number
3. Enter a new password
4. Try logging in with the new password

### Option 4: Check What Password You Used
Run this command in the backend folder to test different passwords:

```bash
node scripts/checkUserPassword.js YOUR_EMAIL YOUR_PASSWORD
```

Example:
```bash
node scripts/checkUserPassword.js matolojr@gmail.com mypassword123
```

This will tell you if the password matches.

---

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and look for:
```
🔐 Attempting login with: {identifier: "...", passwordLength: ...}
```

This shows what you're trying to login with.

### 2. Check Server Logs
Look at your terminal where the server is running. You should see:
```
🔐 Login attempt: {identifier: "...", passwordLength: ...}
🔍 Searching for user in MongoDB: {idEmail: "...", idPhone: "..."}
✅ User found in MongoDB: {email: "...", role: "..."}
🔑 Password match: false
❌ Password mismatch
```

If you see "Password match: false", it means the password is wrong.

### 3. Common Mistakes
- ❌ Using `1234` for newly registered accounts (they have their own password)
- ❌ Typing the wrong email/phone
- ❌ Extra spaces in password
- ❌ Caps Lock is ON
- ❌ Using phone number without country code when you registered with it

---

## Current Users in Database

Run this to see all users:
```bash
cd backend
node scripts/listUsers.js
```

---

## Quick Test

Try logging in with this guaranteed working account:
- **Email:** `john@example.co.ke`
- **Password:** `1234`

If this works, then the system is fine - you just need to use the correct password for your account.

---

## Still Not Working?

1. Make sure the server is running on port 5002
2. Check that MongoDB is connected
3. Verify you're on the correct login page
4. Clear browser cache and try again
5. Try a different browser

---

## Password Reset via Command Line

If you want to reset a user's password manually:

```bash
cd backend
node scripts/setPassword.js YOUR_EMAIL NEW_PASSWORD
```

Example:
```bash
node scripts/setPassword.js matolojr@gmail.com newpass123
```
