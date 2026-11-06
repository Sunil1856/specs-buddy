# SPECS BUDDY WhatsApp Marketing Suite - Admin Setup & Security

This guide outlines user roles, permission hierarchy, security controls, and admin credential management.

---

## 1. Initial Super Admin Access

Upon running `npx tsx prisma/seed.ts`, the following primary account is created:

- **Email**: `admin@specsbuddy.com`
- **Password**: `SpecsBuddy@2026`
- **Role**: `SUPER_ADMIN`

> **Security Warning**: Log in immediately upon deployment, navigate to **Settings > Team & Role Permissions**, and update the Super Admin password.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

SPECS BUDDY implements strict enterprise permission levels:

| Role | Hierarchy Level | Capabilities |
| :--- | :---: | :--- |
| **SUPER_ADMIN** | 50 | Full control: manage Meta API credentials, manage system users, edit all settings, launch/cancel campaigns, view all audit logs. |
| **ADMIN** | 40 | Create campaigns, manage contacts, view analytics, manage team users (cannot delete root super admin). |
| **MARKETING_MANAGER**| 30 | Create & submit templates to Meta, create & dispatch campaigns, import/export contacts, manage media. |
| **CAMPAIGN_OPERATOR** | 20 | Create drafts, launch campaigns, interact in live WhatsApp Inbox, assign conversations. |
| **VIEWER** | 10 | Read-only access to Dashboard, Analytics, Campaign metrics, and Contacts (cannot edit or send messages). |

---

## 3. Opt-Out Suppression Architecture

SPECS BUDDY implements strict compliance with Meta's Messaging Policy and commercial anti-spam guidelines:

1. **Suppression Enforcement**:
   - Before any campaign recipient is queued or sent, the dispatch engine checks:
     `contact.optInStatus !== 'OPTED_IN'` OR `phone in opt_out_records`
   - If suppressed, the recipient status is marked `SUPPRESSED_OPT_OUT`. The Meta Graph API endpoint is **NEVER** called for this recipient, saving marketing credits and preserving your WABA quality rating.

2. **Automated Keyword Opt-Out**:
   - When an incoming customer message contains any of: `STOP`, `UNSUBSCRIBE`, `CANCEL`, `OPT OUT`, `HALT`:
     - The webhook handler automatically marks the contact as `OPTED_OUT`.
     - Logs an entry in `OptOutRecord`.
     - Automatically logs an activity audit record.

3. **Re-Opt-In Support**:
   - If the customer replies `START` or `OPT IN`, the system automatically re-activates their opt-in status and logs a `ConsentRecord`.

---

## 4. 24-Hour Customer Service Window Guard

Meta WhatsApp Cloud API policy enforces a strict 24-hour customer service window for free-form messaging:

- **Inside Window (Active)**: Any inbound message from a customer starts a 24-hour countdown. During this window, team agents can reply freely with any text message.
- **Outside Window (Expired)**: When the 24 hours expire, free-form text input is locked. The UI automatically displays the approved template selector. Sending an approved template restarts the conversation once the customer replies!

---

## 5. Security Checklist for Production

- [ ] Changed default seed password (`SpecsBuddy@2026`).
- [ ] Configured unique 32-character `JWT_SECRET` in `.env`.
- [ ] Confirmed `META_APP_SECRET` is set for HMAC-SHA256 webhook signature validation.
- [ ] Enforced HTTPS with valid SSL certificate.
- [ ] Database backups configured with automated cron job.
