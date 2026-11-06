# SPECS BUDDY WhatsApp Marketing Suite - Meta Cloud API Setup Guide

This guide walks you through setting up the **Official Meta WhatsApp Cloud API** (Graph API v20.0+) for production messaging with SPECS BUDDY.

---

## 1. Overview of Required Meta Credentials

To connect SPECS BUDDY to Meta, you will need 6 credentials:

1. **Meta App ID**: Found in Meta Developer Dashboard header.
2. **WhatsApp Business Account ID (WABA ID)**: Found under WhatsApp > API Setup.
3. **Phone Number ID**: Specific ID for your WhatsApp Business sender number.
4. **Permanent System User Access Token**: Generated via Meta Business Manager.
5. **App Secret**: Found under App Settings > Basic (used for HMAC-SHA256 webhook signature verification).
6. **Webhook Verify Token**: Custom string chosen by you (e.g. `specs_buddy_verify_token_2026`).

---

## 2. Step-by-Step Meta Onboarding

### Step 1: Create a Meta for Developers Account & App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case > Click **Next**.
4. Select **Business** as the App Type.
5. Enter Display Name: `SPECS BUDDY WhatsApp Suite` and select your Meta Business Account.
6. Click **Create App**.

### Step 2: Add WhatsApp Product
1. On the App Dashboard, locate **WhatsApp** and click **Set Up**.
2. Meta will automatically provide you with:
   - A sandbox Test Phone Number ID
   - A temporary 24-hour Access Token
   - A WhatsApp Business Account ID (WABA ID)

### Step 3: Register a Production Phone Number
1. Under **WhatsApp > API Setup**, scroll to **Step 5: Add a phone number**.
2. Click **Add phone number**.
3. Provide:
   - Profile Name: `SPECS BUDDY`
   - Category: `Retail / Optical`
   - Description: `SPECS BUDDY Official Eyewear & Optometry Broadcasts`
4. Enter your dedicated WhatsApp Business phone number and verify via SMS or voice code.
5. Note down the **Phone Number ID** generated for this number.

### Step 4: Generate a Permanent System User Access Token (Never Expires)
*Important: Do not use the temporary 24-hour token for production!*

1. Go to [business.facebook.com/settings](https://business.facebook.com/settings).
2. Under **Users**, click **System Users**.
3. Click **Add** to create a new System User:
   - Name: `SpecsBuddy_API_Bot`
   - System User Role: `Admin`
4. Click **Assign Assets**:
   - Under **Apps**, select your `SPECS BUDDY WhatsApp Suite` app > Grant **Full Control**.
   - Under **WhatsApp Accounts**, select your WABA account > Grant **Full Control**.
5. Click **Generate New Token**:
   - Select your App.
   - Set Token Expiration to: **Never**.
   - Select the following permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Click **Generate Token** and copy the resulting string (starts with `EAA...`).

---

## 3. Configuring Webhooks in Meta

Webhooks allow SPECS BUDDY to receive live message status callbacks (**Sent**, **Delivered**, **Read**, **Failed with Error Codes**) and **Inbound customer replies**!

1. In your Meta App Dashboard, go to **WhatsApp > Configuration**.
2. In the **Webhook** section, click **Edit**:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/whatsapp`
   - **Verify Token**: Enter your chosen token (e.g. `specs_buddy_verify_token_2026`)
3. Click **Verify and Save**. Meta will make an instant `GET` request to SPECS BUDDY to verify the challenge.
4. Click **Manage Webhook Fields** and subscribe to:
   - `messages` (REQUIRED for statuses and incoming chats)
   - `message_template_status_update`

---

## 4. Connecting Meta to SPECS BUDDY

1. Log into SPECS BUDDY at `https://yourdomain.com/login` as Super Admin.
2. Navigate to **Settings & Security > Meta WhatsApp API Setup**.
3. Enter your:
   - **Meta App ID**
   - **WABA ID**
   - **Phone Number ID**
   - **Permanent Access Token**
   - **App Secret**
   - **Webhook Verify Token**
4. Set **Simulation / Sandbox Test Mode** to **OFF** for production.
5. Click **Save Credentials**.
6. Click **Test Meta Connection**. The system will probe the Meta Graph API and report:
   - Connection: `CONNECTED`
   - Quality Rating: `GREEN`
   - Messaging Limit: `Tier 1 (1k/day)` or higher.

Congratulations! Your SPECS BUDDY installation is now connected to official Meta Cloud API infrastructure!
