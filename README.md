# SPECS BUDDY WhatsApp Marketing Suite

> **Production-Ready WhatsApp Marketing & CRM Portal exclusively branded for SPECS BUDDY.**
> Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, BullMQ queue engine, and the Official Meta WhatsApp Cloud API (v20.0+).

---

## 👓 About SPECS BUDDY Suite

**SPECS BUDDY WhatsApp Marketing Suite** is an enterprise-grade SaaS-style portal engineered to power optical retail marketing, prescription reminder automation, order pickup notifications, customer service messaging, and high-conversion broadcast campaigns via official Meta Cloud API infrastructure.

---

## 🌟 Key Functional Highlights

1. **Executive Real-Time Dashboard**:
   - Live metrics calculated directly from database records and Meta webhooks:
     - Total Contacts & Subscribed Contacts
     - Active Campaigns & Total Broadcasts
     - Messages Sent, Delivered, Read, and Failed
     - Delivery Rate % and Read Ratio %
     - Meta API Connection Status & Quality Rating (GREEN / YELLOW / RED)
     - Messaging Tier Limit (Tier 1: 1k/day, Tier 2: 10k/day, etc.)
     - 7-Day Performance Graph
     - Recent Activity Audit Trail

2. **Contact Management & Optical CRM**:
   - Single contact creation with automatic phone normalization to E.164 (`+91...`).
   - Bulk CSV / Excel Import with duplicate detection (skip or update) and detailed import error reports.
   - Contact search, city filter, tags filter, and group assignment.
   - Export contacts to CSV.
   - **Consent Records & Opt-Out Suppression**: Strictly suppresses any customer who opted out or replied `STOP` from all active marketing campaigns.

3. **Customer Audience Groups**:
   - Pre-configured optical groups:
     - *All Customers*
     - *New Customers*
     - *Existing Customers*
     - *VIP Customers*
     - *Repeat Buyers*
     - *Blue Light Lens Buyers*
     - *Contact Lens Users*
   - Custom customer group creation with dynamic member counts.

4. **Bulk Campaign Wizard**:
   - 4-step wizard:
     1. Campaign Name, description, and group selection (displays eligible vs suppressed counts).
     2. Approved Meta Template selection and Header Media URL.
     3. Dynamic variable mapping (`{{1}}` -> Customer Name, `{{2}}` -> City).
     4. Single preview test message dispatch to your real phone before launching.
     5. Schedule date & time with timezone, or immediate dispatch.
   - **Live Interactive WhatsApp Phone Mockup**: Renders the exact message bubble, header image, footer, and buttons on a virtual WhatsApp screen.

5. **Campaign Execution Engine**:
   - Rate-limited queue processing with controlled concurrency and backoff.
   - Idempotency tracking (no duplicate dispatches).
   - Live controls: Pause, Resume, Cancel, and **Retry Eligible Failed Messages**.

6. **Message Template Manager**:
   - Sync templates directly from Meta WhatsApp Business Account (`GET /{waba_id}/message_templates`).
   - Create and submit new templates to Meta for review (Marketing, Utility, Authentication).
   - Interactive preview of approved templates with variable interpolation.

7. **Persistent Campaign Scheduler**:
   - Background worker polling every 10 seconds.
   - Schedule datetime, timezone support (IST, UTC, EST, etc.).
   - Queue management controls.

8. **Digital Media Library**:
   - Image uploads (JPEG, PNG, WebP <= 5MB)
   - PDF optical catalogs (<= 100MB)
   - Video store tours (MP4 <= 16MB)
   - Storage URL & Meta Media ID generation.

9. **WhatsApp Live Chat / Inbox**:
   - Multi-agent WhatsApp Web-like interface.
   - **24-Hour Customer Service Window Guard**: Countdown timer actively warns agents when the 24-hour free-form window has elapsed and enforces approved template usage per Meta policy.
   - Internal staff notes feature.
   - Built-in **Simulate Customer Inbound** tool to test receiving incoming messages or testing the `STOP` opt-out trigger.

10. **Analytics & Delivery Reports**:
    - Conversion funnel: Sent -> Delivered -> Read -> Failed.
    - Meta API Error Code breakdown (e.g. 131026: Undeliverable, 131047: Re-engagement window expired).
    - Campaign-by-campaign comparison table.
    - Export reports to CSV.

11. **Admin Settings & Security**:
    - Meta API credentials with secret masking.
    - Live Connection Test button against Meta Graph API.
    - Simulation / Test Mode toggle for offline development.
    - Role-Based Access Control (Super Admin, Admin, Marketing Manager, Campaign Operator, Viewer).
    - Webhook verification challenge & HMAC-SHA256 signature verification.
    - Full system activity audit logging.

---

## 🚀 Quickstart Guide

### 1. Installation
```bash
cd specs-buddy
npm install
```

### 2. Database Setup & Seeding
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Launch App
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** and log in with:
- **Email**: `admin@specsbuddy.com`
- **Password**: `SpecsBuddy@2026`

---

## 📁 Project Structure

```
specs-buddy/
├── .env.example                     # Environment template
├── Dockerfile                       # Multi-stage production container
├── docker-compose.yml               # Complete compose stack (App, Postgres, Redis, Nginx)
├── INSTALLATION.md                  # Detailed local setup instructions
├── DEPLOYMENT.md                    # VPS, Nginx, SSL production guide
├── META_API_SETUP.md                # Official Meta Cloud API onboarding guide
├── ADMIN_SETUP.md                   # RBAC hierarchy & security guide
├── nginx/
│   └── nginx.conf                   # Production Nginx reverse proxy config
├── prisma/
│   ├── schema.prisma                # SQLite dev schema
│   ├── schema.postgresql.prisma     # Production PostgreSQL schema
│   └── seed.ts                      # Preloaded optical users, templates, & contacts
└── src/
    ├── app/                         # Next.js 14 App Router routes & API endpoints
    │   ├── api/
    │   │   ├── auth/                # JWT Login, Me, Logout
    │   │   ├── dashboard/           # Genuine DB metrics aggregation
    │   │   ├── contacts/            # CRUD, Import, Export, Opt-out
    │   │   ├── groups/              # Audience segment management
    │   │   ├── campaigns/           # Dispatch, Pause, Resume, Retry, Test-send
    │   │   ├── templates/           # Meta templates sync & submission
    │   │   ├── media/               # File uploads with mime/size validation
    │   │   ├── inbox/               # Live chat, 24h window, inbound simulation
    │   │   ├── analytics/           # Reports & Meta error code breakdown
    │   │   ├── settings/            # Meta credentials & user RBAC
    │   │   └── webhooks/whatsapp/   # Meta challenge & HMAC SHA-256 verification
    │   ├── dashboard/               # Executive KPI dashboard
    │   ├── contacts/                # CRM data table with bulk import modal
    │   ├── groups/                  # Customer segment cards
    │   ├── campaigns/               # Broadcast manager & 4-step wizard
    │   ├── templates/               # Meta template cards & phone preview
    │   ├── scheduler/               # Timeline & execution countdown
    │   ├── media/                   # Media asset grid
    │   ├── inbox/                   # WhatsApp Web chat canvas
    │   ├── analytics/               # Funnel charts & CSV export
    │   ├── settings/                # Credentials & user management
    │   └── login/                   # Branded SaaS sign-in page
    ├── components/layout/           # Dark navy sidebar, header, layout wrapper
    ├── context/                     # AuthContext, ThemeContext
    ├── lib/
    │   ├── prisma.ts                # Prisma singleton
    │   ├── auth.ts                  # JWT & bcrypt verification, RBAC permissions
    │   ├── whatsapp/
    │   │   ├── meta-client.ts       # Meta Graph API v20.0 client
    │   │   └── webhook-handler.ts   # Webhook signature & status update handler
    │   └── campaigns/
    │       └── campaign-engine.ts   # Concurrency, suppression, queue dispatch
    └── workers/
        └── campaign-worker.ts       # Standalone background execution worker
```

---

## 📜 License & Compliance

SPECS BUDDY WhatsApp Marketing Suite strictly adheres to:
- Official **Meta Business Messaging Policies**
- Meta **WhatsApp Cloud API Terms of Service**
- Mandatory **24-Hour Customer Service Window** enforcement
- Strict **Opt-Out Suppression** protocol (automated keyword `STOP` suppression)
- Customer **Consent Tracking**
