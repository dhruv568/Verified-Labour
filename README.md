# Verified Labour — काम चाहिए? कामगार चाहिए? दोनों एक जगह।

Production-ready, full-stack on-demand labour marketplace platform built for Indian households, contractors, and verified skilled workers.

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: Private](https://img.shields.io/badge/License-Private-red.svg)]()

---

## 1. Product Features & Architecture

### Core Marketplace Flow
- **Automatic Geolocation**: Browser Geolocation API + reverse geocoding with graceful fallbacks (manual locality search, PIN code, saved addresses).
- **Worker Discovery & Privacy Protection**: Distance matching via server-side Haversine formula within worker's defined service radius. **Worker exact GPS coordinates are never publicly exposed**; only approximate distance (e.g. "2.4 km away") and locality are shown.
- **18 Seeded Blueprint Categories**:
  Construction, Plumbing, Electrical, Painting, Loading & Moving, Cleaning, Cook, Carpenter, Driver, Washerman, Computer Hardware, Computer Software, Confectioner, Car/2 Wheeler Mechanic, Gas Cylinder Delivery, Watchman, House Care Taker, Office Boy.
- **Strict Linear State Machine**:
  `REQUESTED` ➔ `ACCEPTED` ➔ `SCHEDULED` ➔ `WORKER_ON_THE_WAY` ➔ `ARRIVED` ➔ `WORK_STARTED` ➔ `WORK_COMPLETED` ➔ `PAYMENT_PENDING` ➔ `PAID` ➔ `REVIEWED` ➔ `COMPLETED`
  Illegal transitions (e.g. `REQUESTED` directly to `PAID`) are blocked server-side.
- **Double-Booking & Conflict Prevention**: Server-side validation prevents overlapping bookings for the same worker.

### Cashfree Secure ID & KYC Integration
- **Consent-based Aadhaar OTP verification** (Cashfree Secure ID). Raw Aadhaar numbers are never stored; only masked identifiers (`XXXXXXXX8291`) and verification tokens are retained.
- **Cashfree Bank Account Verification**: Validates account number, IFSC code, and beneficiary name matching. Account numbers are masked in all UIs (`XXXXXXXX4512`).
- **Granular Trust Badges**: `Identity Verified`, `Bank Verified`, `Skills Verified`, and `Verified Worker`.

### Payment & Settlement Infrastructure
- **Razorpay Integration**: Order creation, cryptographic HMAC-SHA256 signature verification, and idempotent webhook processing.
- **Worker Earnings & Wallet**: 10% platform fee calculation, 18% GST deduction, and transparent settlement ledger.

### Multi-Role Dashboards (RBAC)
- **Customer Portal** (`/customer/dashboard`): Active bookings, real-time tracking, in-app chat, Razorpay payments, reviews, and saved addresses.
- **Worker Cockpit** (`/worker/dashboard`): Mobile-app layout, online/offline availability toggle, incoming job requests (Accept/Reject), live step transitions ("On the way", "Arrived", "Start Work", "Complete Work").
- **Worker Earnings** (`/worker/earnings`): Daily/weekly/monthly breakdown and bank transfer details.
- **Commercial Bulk Labour Portal** (`/business/bulk`): Contractors post multi-worker project requirements; workers apply.
- **Admin Control Center** (`/admin`): Real-time database metrics, Cashfree KYC verification queues, dynamic category manager, dispute arbitrator, and audit logs.

---

## 2. Seeded Test Accounts

| Role | Phone | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Admin** | `+919999999999` | `Admin@123456` | Operations Control Center (`/admin`) |
| **Customer** | `+919876543210` | `Customer@123` | Customer with saved addresses in Surat (`/customer/dashboard`) |
| **Plumber** | `+919111122221` | `Worker@123` | Ramesh Patel (Master Plumber, 5.0 rating) |
| **Electrician** | `+919111122222` | `Worker@123` | Suresh Kumar Prajapati (Licensed Electrician) |
| **Business** | `+919888877777` | `Business@123` | Surat Infrastructure & Builders Pvt Ltd (`/business/bulk`) |

*Any mobile number can also be used to log in or register via OTP (Sandbox code: `123456`).*

---

## 3. Quick Start & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Generate Prisma client & push schema
npm run db:generate
npm run db:push

# 4. Seed initial platform configurations, 18 categories, and verified workers
npm run db:seed

# 5. Run automated test suite
npm test

# 6. Start development server
npm run dev
# App runs at http://localhost:3000 (or http://localhost:3001 if PORT=3001 is set in .env)
```

---

## 4. Automated Test Suite

Run tests via:
```bash
npm test
```
The test suite validates:
- Haversine distance and radius matching
- Worker GPS coordinate sanitization
- Sliding-window rate limiter
- Cashfree Aadhaar consent & OTP validation
- Cashfree Bank account & IFSC validation
- Strict Job State Machine transition checks
- Razorpay order creation and HMAC signature verification
- Platform fee & GST calculations

---

## 5. Production VPS Deployment & Port Isolation

Verified Labour is designed to run in production alongside existing applications on your VPS.

- **Port Isolation**: Verified Labour runs strictly on **Port 3001** (leaving Port 3000 completely dedicated to EduConnects).
- **Process Management**: Configured with PM2 via `ecosystem.config.js`.
- **Web Server**: Fully documented for OpenLiteSpeed (OLS) reverse proxy with SSL.

Detailed, step-by-step instructions are available in [DEPLOYMENT.md](DEPLOYMENT.md).

```bash
# Production start via PM2
pm2 start ecosystem.config.js
```
