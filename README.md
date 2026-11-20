# GPK Crackers - Chit Scheme Management System

A full-stack web application designed for **GPK Crackers** to manage monthly chit savings schemes, customer registrations, passbooks, and installment collection.

## 🌟 Key Features

### Customer Portal (`/chit-scheme`)
- **Interactive Scheme Catalog:** Browse available Diwali chit schemes with monthly installments, total duration, and maturity returns.
- **Multi-Scheme Enrollment:** Customers can select multiple schemes, adjust person quantities per scheme, and see automated real-time price calculations.
- **Mobile OTP / Instant Verification:** Easy phone verification to track monthly chit payments and passbook history.
- **Passbook & Digital Receipts:** Customers can view month-by-month payment schedules and download official branded GPK Crackers PDF/printed receipts.

### Admin Dashboard (`/admin` & `/admin/chit-scheme`)
- **Application Approvals:** Review new enrollment requests, view combined financial breakdowns, and approve/reject with real-time status updates.
- **Scheme Configuration:** Create, edit, activate, or archive schemes with optional promotional poster uploads.
- **Passbook & Payment Logging:** Record monthly payments (Cash, UPI, GPay, Bank Transfer) with instant receipt generation.
- **WhatsApp Integration:** One-click WhatsApp payment reminders with pre-filled customer details and passbook balances.
- **Brand & Company Settings:** Configure business profile, contact numbers, address, and logo for invoices and receipts.

## 🛠 Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Winston Logger
- **Storage:** Cloudinary (for scheme banners and company logos)
- **Deployment:** PM2, Nginx, Render/VPS deployment script (`deploy.sh`)

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd server
npm install
# Ensure server/.env is configured
npm run dev # or: npm start
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

### 3. VPS Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

---
© 2026 GPK Crackers. All rights reserved.
