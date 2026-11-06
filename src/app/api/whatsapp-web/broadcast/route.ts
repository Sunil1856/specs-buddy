import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import whatsAppWebSessionManager from "@/lib/whatsapp/web-session";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();
    const { groupId, phoneList, messageText, mediaUrl, mediaType } = body;

    if (!messageText?.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    // Verify WhatsApp Web session status
    const session = await whatsAppWebSessionManager.getSessionState();
    if (session.status !== "CONNECTED") {
      return NextResponse.json(
        { error: "WhatsApp Web session is not connected. Please scan QR code or link device first." },
        { status: 400 }
      );
    }

    // Collect recipient list
    interface RecipientItem {
      phone: string;
      name?: string;
      city?: string;
    }
    const recipients: RecipientItem[] = [];

    if (groupId) {
      const group = await prisma.contactGroup.findUnique({
        where: { id: groupId },
        include: {
          members: {
            include: { contact: true },
          },
        },
      });

      if (group) {
        for (const m of group.members) {
          recipients.push({
            phone: m.contact.phone,
            name: m.contact.name,
            city: m.contact.city || undefined,
          });
        }
      }
    } else if (phoneList && Array.isArray(phoneList)) {
      for (const p of phoneList) {
        if (typeof p === "string" && p.trim()) {
          recipients.push({ phone: p.trim() });
        } else if (p && typeof p === "object" && p.phone) {
          recipients.push(p);
        }
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No valid recipients found for broadcast" }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let suppressedCount = 0;
    const dispatchResults: any[] = [];

    for (const r of recipients) {
      // 1. Opt-out suppression check
      const cleanPhone = r.phone.startsWith("+") ? r.phone : "+" + r.phone.replace(/[^0-9]/g, "");
      const contact = await prisma.contact.findUnique({ where: { phone: cleanPhone } });
      const isOptedOut =
        contact?.optInStatus === "OPTED_OUT" ||
        (await prisma.optOutRecord.findFirst({ where: { phone: cleanPhone } }));

      if (isOptedOut) {
        suppressedCount++;
        dispatchResults.push({
          phone: cleanPhone,
          name: r.name,
          status: "SUPPRESSED_OPT_OUT",
          reason: "Customer opted out of marketing broadcasts",
        });
        continue;
      }

      // 2. Variable replacement (e.g. {{name}}, {{city}})
      let personalizedBody = messageText;
      personalizedBody = personalizedBody.replace(/{{name}}/gi, r.name || "Customer");
      personalizedBody = personalizedBody.replace(/{{city}}/gi, r.city || "your city");
      personalizedBody = personalizedBody.replace(/{{phone}}/gi, cleanPhone);

      try {
        const sendRes = await whatsAppWebSessionManager.sendMessageViaWeb({
          to: cleanPhone,
          body: personalizedBody,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
        });

        if (sendRes.success) {
          sentCount++;
          dispatchResults.push({
            phone: cleanPhone,
            name: r.name,
            status: "SENT",
            messageId: sendRes.messageId,
          });

          // Record outbound message in database
          await prisma.message.create({
            data: {
              metaMessageId: sendRes.messageId,
              phone: cleanPhone,
              direction: "OUTBOUND",
              messageType: mediaUrl ? "MEDIA" : "TEXT",
              content: personalizedBody,
              status: "SENT",
              timestamp: new Date(),
            },
          });
        } else {
          failedCount++;
          dispatchResults.push({
            phone: cleanPhone,
            name: r.name,
            status: "FAILED",
          });
        }
      } catch (err) {
        failedCount++;
        dispatchResults.push({
          phone: cleanPhone,
          name: r.name,
          status: "FAILED",
        });
      }

      // Safety delay to prevent WhatsApp rate throttling
      await new Promise((res) => setTimeout(res, 80));
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "WHATSAPP_WEB_BROADCAST",
      details: `Broadcast sent to ${sentCount} recipients via WhatsApp Web (${suppressedCount} suppressed, ${failedCount} failed)`,
    });

    return NextResponse.json({
      success: true,
      totalRecipients: recipients.length,
      sentCount,
      suppressedCount,
      failedCount,
      results: dispatchResults,
    });
  } catch (error: any) {
    console.error("WhatsApp Web broadcast error:", error);
    return NextResponse.json({ error: error.message || "Broadcast dispatch failed" }, { status: 500 });
  }
}
