import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";
import whatsAppWebSessionManager from "@/lib/whatsapp/web-session";
import { getAuthUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          include: {
            consentRecords: { take: 3, orderBy: { createdAt: "desc" } },
            optOutRecords: { take: 3, orderBy: { optOutDate: "desc" } },
          },
        },
        assignedTo: { select: { id: true, name: true, role: true } },
        messages: { orderBy: { sentAt: "asc" } },
        notes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Reset unread count when opened
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: params.id },
        data: { unreadCount: 0 },
      });
    }

    const now = Date.now();
    let isWindowActive = false;
    let minutesRemaining = 0;

    if (conversation.customerServiceWindowExpiresAt) {
      const expiryTime = new Date(conversation.customerServiceWindowExpiresAt).getTime();
      if (expiryTime > now) {
        isWindowActive = true;
        minutesRemaining = Math.max(0, Math.round((expiryTime - now) / 60000));
      }
    }

    const apiCred = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      conversation: {
        ...conversation,
        gatewayMode: apiCred?.gatewayMode || "META_CLOUD_API",
        serviceWindow: {
          isActive: isWindowActive,
          hoursRemaining: Math.floor(minutesRemaining / 60),
          minutesRemaining: minutesRemaining % 60,
          expiresAt: conversation.customerServiceWindowExpiresAt,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();
    const { action = "SEND_MESSAGE", messageText, templateId, templateVariables, noteContent, assignedToId } = body;

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 1. ADD INTERNAL NOTE ACTION
    if (action === "ADD_NOTE") {
      if (!noteContent) return NextResponse.json({ error: "Note content required" }, { status: 400 });

      const note = await prisma.conversationNote.create({
        data: {
          conversationId: conversation.id,
          authorId: user?.id,
          authorName: user?.name || "Agent",
          content: noteContent.trim(),
        },
      });

      return NextResponse.json({ success: true, note });
    }

    // 2. ASSIGN AGENT ACTION
    if (action === "ASSIGN_AGENT") {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { assignedToId: assignedToId || null },
      });
      return NextResponse.json({ success: true, message: "Agent assigned" });
    }

    // 3. SEND MESSAGE ACTION (WITH 24-HOUR CUSTOMER SERVICE WINDOW ENFORCEMENT ON META, OR UNRESTRICTED ON WHATSAPP WEB)
    const now = Date.now();
    const expiryTime = conversation.customerServiceWindowExpiresAt
      ? new Date(conversation.customerServiceWindowExpiresAt).getTime()
      : 0;
    const isWindowActive = expiryTime > now;

    // Check if customer opted out
    if (conversation.contact.optInStatus === "OPTED_OUT") {
      return NextResponse.json(
        { error: "Customer has opted out of communications. Outgoing messages are suppressed." },
        { status: 403 }
      );
    }

    const apiCred = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });
    const isWhatsAppWeb = apiCred?.gatewayMode === "WHATSAPP_WEB";

    let sendResult: any;

    if (isWhatsAppWeb) {
      // WHATSAPP WEB GATEWAY: No 24-hour window restriction! Direct messaging allowed 24/7!
      let outgoingBody = messageText;
      if (!outgoingBody && templateId) {
        const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
        outgoingBody = template?.bodyText || "Hello from SPECS BUDDY!";
      }

      if (!outgoingBody) {
        return NextResponse.json({ error: "Message body cannot be empty" }, { status: 400 });
      }

      const webRes = await whatsAppWebSessionManager.sendMessageViaWeb({
        to: conversation.phone,
        body: outgoingBody,
      });

      sendResult = {
        success: webRes.success,
        messageId: webRes.messageId,
        isSimulated: true,
      };
    } else if (!isWindowActive) {
      // OFFICIAL META CLOUD API: 24-HOUR WINDOW EXPIRED! Meta policy requires using an approved template!
      if (!templateId) {
        return NextResponse.json(
          {
            error:
              "The 24-Hour Customer Service Window has expired for this contact. Meta requires an approved WhatsApp Template to initiate or re-engage conversation. (Tip: Switch to WhatsApp Web in Settings for unrestricted 24/7 messaging).",
            requiresTemplate: true,
          },
          { status: 403 }
        );
      }

      // Send approved template
      const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      sendResult = await metaWhatsAppClient.sendTemplateMessage({
        to: conversation.phone,
        templateName: template.name,
        languageCode: template.language,
        headerType: template.headerType as any,
        headerUrl: template.headerContent || undefined,
        bodyVariables: templateVariables || [conversation.contactName],
      });
    } else {
      // Customer Service Window is ACTIVE on Meta -> Free-form text message allowed!
      if (!messageText) {
        return NextResponse.json({ error: "Message body cannot be empty" }, { status: 400 });
      }

      sendResult = await metaWhatsAppClient.sendTextMessage({
        to: conversation.phone,
        body: messageText,
      });
    }

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.errorMessage || "Failed to send message via WhatsApp gateway" },
        { status: 500 }
      );
    }

    const messageRecord = await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        senderType: "AGENT",
        body: messageText || "Approved Template Sent",
        metaMessageId: sendResult.messageId,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: messageText || "Template message sent",
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: messageRecord,
      isSimulated: sendResult.isSimulated,
    });
  } catch (error: any) {
    console.error("Conversation action error:", error);
    return NextResponse.json({ error: error.message || "Failed to process action" }, { status: 500 });
  }
}
