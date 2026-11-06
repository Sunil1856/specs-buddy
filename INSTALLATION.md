# SPECS BUDDY WhatsApp Marketing Suite - Installation Guide

Welcome to **SPECS BUDDY** - The Enterprise WhatsApp Marketing & CRM Portal for eyewear and optical businesses.

---

## 1. Prerequisites

Before installing, ensure your environment has:
- **Node.js**: v18.18+ or v20+ (Node v24 is also fully supported)
- **npm** (v9+) or **pnpm** (v8+)
- **Git**

---

## 2. Quick Local Setup (SQLite Mode)

The application comes pre-configured with SQLite for zero-friction local development and testing.

### Step 1: Clone or Navigate to the Project
```bash
cd specs-buddy
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
The default `.env` is already configured for local SQLite operation and Meta Simulation/Sandbox test mode.

### Step 4: Initialize the Database & Seed Preloaded Data
Run Prisma migration and execute the seed script:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

This will automatically create:
1. **Super Admin Account**: `admin@specsbuddy.com` / `SpecsBuddy@2026`
2. **Marketing Lead Account**: `manager@specsbuddy.com` / `Manager@2026`
3. **Campaign Operator Account**: `operator@specsbuddy.com` / `Operator@2026`
4. **Standard Eyewear Groups**: All Customers, VIP Customers, Repeat Buyers, etc.
5. **Meta Approved Eyewear Templates**: Welcome offers, eye test reminders, order collection notices, festive discounts.
6. **Pre-configured Opted-In & Suppressed Contacts** for testing.

### Step 5: Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 3. Background Campaign Scheduler Worker

To run the background scheduler worker locally (which polls every 10 seconds for scheduled campaigns):
```bash
npm run worker
```

---

## 4. Default Credentials Quick Reference

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@specsbuddy.com` | `SpecsBuddy@2026` |
| **Marketing Lead** | `manager@specsbuddy.com` | `Manager@2026` |
| **Campaign Operator** | `operator@specsbuddy.com` | `Operator@2026` |

---

## 5. Verification Checklist

1. Sign in to `http://localhost:3000` with the Super Admin credentials.
2. The Dashboard will immediately load with genuine statistics from the seeded database.
3. Navigate to **Contacts CRM** to inspect contacts, import CSVs, or toggle opt-out suppression.
4. Navigate to **Campaigns > Create Campaign** to experience the 4-step wizard with the live interactive WhatsApp phone mockup.
5. Open **WhatsApp Inbox** to test live conversations and the 24-Hour Customer Service Window enforcement.
