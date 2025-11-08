# QR Code System Documentation

## Overview

The QR code system allows staff to scan customer QR codes and instantly view all their orders in a popup modal.

---

## How It Works

### 1. Customer Side (QR Code Generation)

**Location:** Customer Dashboard (`cdashboard.html`)

#### QR Code Content:
Each customer has a **unique QR code** that encodes their user ID:

```
Format: http://localhost:5002/customer/{userId}/orders
Example: http://localhost:5002/customer/690fc564605a6632ae33e1cb/orders
```

#### Generation Process:
1. Customer logs in
2. `userId` is stored in `localStorage`
3. QR code is automatically generated on dashboard load
4. QR code is unique to each customer (based on their userId)

```javascript
function generateQRCode(){
    const userId = localStorage.getItem('userId');
    const qrText = `${API_BASE}/customer/${userId}/orders`;
    new QRCode(qrContainer, {
        text: qrText,
        width: 150,
        height: 150
    });
}
```

---

### 2. Staff Side (QR Code Scanning)

**Location:** QR Scanner Page (`qr-scanner.html`)

#### Features:
- ✅ Camera-based QR code scanning
- ✅ Real-time detection
- ✅ Scrollable popup modal
- ✅ Exit button to close modal
- ✅ Displays customer info and all orders
- ✅ Beautiful, responsive UI

#### Scanning Process:

1. **Staff opens scanner:**
   - Navigate to Staff Dashboard
   - Click "📱 Scan QR Code" in navigation

2. **Start scanning:**
   - Click "Start Scanner" button
   - Camera activates
   - Point camera at customer's QR code

3. **QR code detected:**
   - Scanner automatically stops
   - Extracts userId from QR code
   - Fetches customer data from backend

4. **Display orders:**
   - Popup modal appears
   - Shows customer information
   - Lists all orders with details
   - Scrollable if many orders
   - Click X or outside modal to close

---

### 3. Backend API

**Endpoint:** `GET /api/customer/:userId/orders`

#### Request:
```
GET http://localhost:5002/api/customer/690fc564605a6632ae33e1cb/orders
```

#### Response:
```json
{
  "user": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "phone": "0712345678",
    "role": "Customer"
  },
  "orders": [
    {
      "_id": "order123",
      "orderNumber": "ORD-001",
      "garmentType": "Shirt",
      "quantity": 2,
      "price": 300,
      "totalAmount": 300,
      "status": "In Progress",
      "paymentStatus": "Paid",
      "items": [
        {
          "itemType": "Shirt",
          "quantity": 2,
          "price": 150
        }
      ],
      "pickupDate": "2025-11-10T00:00:00.000Z",
      "createdAt": "2025-11-09T00:00:00.000Z"
    }
  ],
  "totalOrders": 1
}
```

---

## User Interface

### QR Scanner Page

#### Layout:
```
┌─────────────────────────────┐
│  📱 Scan Customer QR Code   │
├─────────────────────────────┤
│  [Status Message]           │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   Camera View       │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [Start Scanner Button]     │
│  [Back to Dashboard]        │
└─────────────────────────────┘
```

### Orders Modal (Popup)

#### Layout:
```
┌──────────────────────────────────────┐
│  📦 Customer Orders            [X]   │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐ │
│  │ 👤 John Doe                    │ │
│  │ Email: john@example.com        │ │
│  │ Phone: 0712345678              │ │
│  │ Total Orders: 3                │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Order #ORD-001    [In Progress]│ │
│  │ Date: Nov 9, 2025              │ │
│  │ Items: 2 item(s)               │ │
│  │  • 2x Shirt - KSh 150          │ │
│  │ Pickup: Nov 10, 2025           │ │
│  │ Total: KSh 300                 │ │
│  └────────────────────────────────┘ │
│                                      │
│  [Scrollable if more orders...]     │
└──────────────────────────────────────┘
```

---

## Features

### 1. Unique QR Codes
- Each customer has a unique QR code
- QR code contains customer's userId
- Cannot be used by other customers
- Secure and traceable

### 2. Scrollable Modal
- Modal has fixed max-height (80vh)
- Content scrolls if too many orders
- Smooth scrolling experience
- Works on mobile and desktop

### 3. Exit Options
- Click X button in header
- Click outside modal (backdrop)
- Both close the modal smoothly

### 4. Order Display
- Shows all customer orders
- Sorted by date (newest first)
- Color-coded status badges
- Detailed item breakdown
- Total amount highlighted

### 5. Status Badges
- **Received** - Yellow
- **In Progress** - Blue
- **Ready for Pickup** - Green
- **Completed** - Light blue
- **Picked Up** - Gray

---

## Technical Implementation

### Files Modified/Created:

1. **`frontend/qr-scanner.html`** (NEW)
   - QR code scanner interface
   - Camera integration
   - Modal popup for orders
   - Responsive design

2. **`frontend/cdashboard.html`** (UPDATED)
   - QR code generation with userId
   - Uses localStorage for userId

3. **`frontend/staff-Dashboard.html`** (UPDATED)
   - Added "Scan QR Code" navigation link

4. **`backend/routes/customerRoutes.js`** (UPDATED)
   - Endpoint to fetch orders by userId
   - Returns JSON with user and orders

5. **`backend/models/Order.js`** (UPDATED)
   - Added `userId` field
   - Added `totalAmount` field
   - Added `items` array
   - Added `pickupDate` field

---

## Libraries Used

### Frontend:
1. **QRCode.js** - Generate QR codes
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
   ```

2. **html5-qrcode** - Scan QR codes
   ```html
   <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
   ```

---

## Usage Instructions

### For Customers:

1. Login to customer dashboard
2. Your unique QR code appears automatically
3. Show QR code to staff when needed
4. Staff can scan to view your orders

### For Staff:

1. Login to staff dashboard
2. Click "📱 Scan QR Code" in navigation
3. Click "Start Scanner"
4. Point camera at customer's QR code
5. View customer orders in popup
6. Click X or outside to close
7. Scan another QR code if needed

---

## Security Considerations

### ✅ Secure:
- QR codes contain only userId (no sensitive data)
- Backend validates userId exists
- Password excluded from API response
- CORS enabled for localhost only

### ⚠️ Production Recommendations:
- Add authentication to scanner page
- Implement rate limiting on API
- Add HTTPS for production
- Validate staff permissions
- Add audit logging

---

## Testing

### Test QR Code Generation:
1. Login as customer (demo account)
2. Navigate to customer dashboard
3. Verify QR code appears
4. Check browser console for userId

### Test QR Code Scanning:
1. Login as staff
2. Navigate to QR scanner
3. Start scanner
4. Scan customer QR code (from phone/screen)
5. Verify modal appears with orders

### Test API Endpoint:
```bash
# Get userId from customer login
# Then test endpoint:
curl http://localhost:5002/api/customer/{userId}/orders
```

---

## Troubleshooting

### QR Code Not Generating:
- Check if userId is in localStorage
- Verify user is logged in
- Check browser console for errors
- Refresh page

### Scanner Not Working:
- Allow camera permissions
- Check HTTPS (required for camera)
- Try different browser
- Check camera is not in use

### Orders Not Loading:
- Verify backend is running
- Check userId is valid
- Verify orders exist in database
- Check browser console

### Modal Not Closing:
- Click X button
- Click outside modal
- Refresh page if stuck

---

## Future Enhancements

### Potential Features:
- [ ] Print order receipt from modal
- [ ] Update order status from scanner
- [ ] Add payment processing
- [ ] Export orders to PDF
- [ ] Send SMS notification
- [ ] Add order search/filter
- [ ] Barcode scanning support
- [ ] Offline mode support

---

## API Reference

### Get Customer Orders

**Endpoint:** `GET /api/customer/:userId/orders`

**Parameters:**
- `userId` (path) - MongoDB ObjectId of the customer

**Response:** JSON object with user info and orders array

**Status Codes:**
- `200` - Success
- `404` - User not found
- `500` - Server error

**Example:**
```javascript
fetch('http://localhost:5002/api/customer/690fc564605a6632ae33e1cb/orders')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Summary

✅ **Unique QR codes** for each customer  
✅ **Camera-based scanning** for staff  
✅ **Scrollable popup modal** with all orders  
✅ **Exit button** and backdrop click to close  
✅ **Beautiful, responsive UI**  
✅ **Real-time order display**  
✅ **Secure and efficient**  

The QR code system is now fully functional and ready to use! 🎉
