import crypto from "crypto";
import prisma from "../prisma";
import metaWhatsAppClient from "./meta-client";

export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const config = await metaWhatsAppClient.loadConfig();

  // If in test mode or appSecret not configured, skip verification
  if (config.isTestMode || !config.appSecret || config.appSecret.includes("sample")) {
    return true;
  }

  if (!signatureHeader) return false;

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const expectedSignature = crypto
    .createHmac("sha256", config.appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(parts[1], "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );
}

export async function processWebhookPayload(payload: any) {
  // Store raw webhook event for debugging and audit
  await prisma.webhookEvent.create({
    data: {
      eventType: payload.entry?.[0]?.changes?.[0]?.field || "whatsapp_change",
      payload: JSON.stringify(payload),
      processed: false,
    },
  });

  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0]?.value;

  if (!change) return;

  // 1. Process Status Updates (sent, delivered, read, failed)
  if (change.statuses && Array.isArray(change.statuses)) {
    for (const statusObj of change.statuses) {
      await handleStatusUpdate(statusObj);
    }
  }

  // 2. Process Inbound Messages from Customers
  if (change.messages && Array.isArray(change.messages)) {
    const contactInfo = change.contacts?.[0];
    for (const messageObj of change.messages) {
      await handleInboundMessage(messageObj, contactInfo);
    }
  }
}

async function handleStatusUpdate(statusObj: {
  id: string; // wamid
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message?: string; error_data?: { details: string } }>;
}) {
  const metaMessageId = statusObj.id;
  const statusUpper = statusObj.status.toUpperCase();
  const timestamp = new Date(parseInt(statusObj.timestamp) * 1000 || Date.now());

  // Update generic Message table
  await prisma.message.updateMany({
    where: { metaMessageId },
    data: {
      status: statusUpper,
      errorCode: statusObj.errors?.[0]?.code ? String(statusObj.errors[0].code) : undefined,
      errorMessage: statusObj.errors?.[0]?.message || statusObj.errors?.[0]?.title,
    },
  });

  // Find recipient in CampaignRecipient
  const recipient = await prisma.campaignRecipient.findFirst({
    where: { metaMessageId },
    include: { campaign: true },
  });

  if (recipient) {
    const updateData: any = {
      status: statusUpper,
    };

    if (statusUpper === "DELIVERED") {
      updateData.deliveredAt = timestamp;
      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { deliveredCount: { increment: 1 } },
      });
    } else if (statusUpper === "READ") {
      updateData.readAt = timestamp;
      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { readCount: { increment: 1 } },
      });
    } else if (statusUpper === "FAILED") {
      updateData.failedAt = timestamp;
      updateData.errorCode = String(statusObj.errors?.[0]?.code || "UNKNOWN");
      updateData.errorMessage =
        statusObj.errors?.[0]?.error_data?.details ||
        statusObj.errors?.[0]?.message ||
        statusObj.errors?.[0]?.title ||
        "Message delivery failed";

      await prisma.campaign.update({
        where: { id: recipient.campaignId },
        data: { failedCount: { increment: 1 } },
      });
    }

    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: updateData,
    });
  }

  // Also check if this was a conversation message
  await prisma.conversationMessage.updateMany({
    where: { metaMessageId },
    data: { status: statusUpper },
  });
}

async function handleInboundMessage(
  messageObj: any,
  contactInfo?: { profile?: { name?: string }; wa_id?: string }
) {
  const phone = "+" + messageObj.from;
  const customerName = contactInfo?.profile?.name || "Customer";

  // Extract body content
  let body = "";
  if (messageObj.type === "text") {
    body = messageObj.text?.body || "";
  } else if (messageObj.type === "button") {
    body = messageObj.button?.text || "";
  } else if (messageObj.type === "interactive") {
    body =
      messageObj.interactive?.button_reply?.title ||
      messageObj.interactive?.list_reply?.title ||
      "Interactive Reply";
  } else if (messageObj.type === "image") {
    body = "[Image received]";
  } else if (messageObj.type === "document") {
    body = `[Document: ${messageObj.document?.filename || "file.pdf"}]`;
  } else {
    body = `[${messageObj.type || "media"} received]`;
  }

  const cleanBodyUpper = body.trim().toUpperCase();

  // Find or create Contact
  let contact = await prisma.contact.findUnique({
    where: { phone },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: customerName,
        phone,
        optInStatus: "OPTED_IN",
        consentSource: "WHATSAPP_INBOUND",
        consentDate: new Date(),
        tags: "whatsapp_inbound",
      },
    });

    // Add to 'All Customers' and 'New Customers' groups
    const defaultGroups = await prisma.contactGroup.findMany({
      where: { name: { in: ["All Customers", "New Customers"] } },
    });
    for (const g of defaultGroups) {
      await prisma.contactGroupMember.create({
        data: { contactId: contact.id, groupId: g.id },
      });
    }
  }

  // 1. CHECK FOR OPT-OUT TRIGGERS (e.g. STOP, UNSUBSCRIBE, CANCEL)
  if (
    cleanBodyUpper === "STOP" ||
    cleanBodyUpper === "UNSUBSCRIBE" ||
    cleanBodyUpper === "OPT OUT" ||
    cleanBodyUpper === "CANCEL"
  ) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { optInStatus: "OPTED_OUT" },
    });

    await prisma.optOutRecord.create({
      data: {
        contactId: contact.id,
        phone: contact.phone,
        reason: "REPLIED_STOP",
        channel: "WHATSAPP",
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CUSTOMER_OPT_OUT",
        details: `Customer ${contact.name} (${contact.phone}) unsubscribed via WhatsApp reply '${body.trim()}'.`,
      },
    });
  } else if (cleanBodyUpper === "START" || cleanBodyUpper === "OPT IN") {
    // RE-OPT-IN TRIGGER
    await prisma.contact.update({
      where: { id: contact.id },
      data: { optInStatus: "OPTED_IN" },
    });

    await prisma.consentRecord.create({
      data: {
        contactId: contact.id,
        source: "WHATSAPP_INBOUND",
        proofDetails: `Opted back in via WhatsApp reply '${body.trim()}'`,
      },
    });
  }

  // 2. UPSERT CONVERSATION & RESET 24-HOUR CUSTOMER SERVICE WINDOW
  const serviceWindowExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Now + 24 hours

  const conversation = await prisma.conversation.upsert({
    where: { contactId: contact.id },
    update: {
      lastMessage: body,
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
      customerServiceWindowExpiresAt: serviceWindowExpiry,
    },
    create: {
      contactId: contact.id,
      phone: contact.phone,
      contactName: contact.name,
      lastMessage: body,
      lastMessageAt: new Date(),
      unreadCount: 1,
      customerServiceWindowExpiresAt: serviceWindowExpiry,
      status: "OPEN",
    },
  });

  // 3. STORE CONVERSATION MESSAGE
  await prisma.conversationMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      senderType: "CUSTOMER",
      body,
      metaMessageId: messageObj.id,
      status: "DELIVERED",
      sentAt: new Date(),
    },
  });
}
