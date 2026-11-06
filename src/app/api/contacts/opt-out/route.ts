import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { contactId, optOut, reason } = await request.json();

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (optOut) {
      // Set to OPTED_OUT and record in opt_out_records
      await prisma.contact.update({
        where: { id: contactId },
        data: { optInStatus: "OPTED_OUT" },
      });

      await prisma.optOutRecord.create({
        data: {
          contactId: contact.id,
          phone: contact.phone,
          reason: reason || "ADMIN_SUPPRESSED",
          channel: "WHATSAPP",
        },
      });

      await logActivity({
        userId: user?.id,
        userName: user?.name,
        action: "SUPPRESS_CONTACT",
        details: `Suppressed contact ${contact.name} (${contact.phone}) - Opted Out`,
      });
    } else {
      // Re-enable opt-in
      await prisma.contact.update({
        where: { id: contactId },
        data: { optInStatus: "OPTED_IN" },
      });

      await prisma.consentRecord.create({
        data: {
          contactId: contact.id,
          source: "ADMIN_RE_OPT_IN",
          proofDetails: `Re-opted in by ${user?.name || "Admin"} on ${new Date().toISOString()}`,
        },
      });

      await logActivity({
        userId: user?.id,
        userName: user?.name,
        action: "RE_OPT_IN_CONTACT",
        details: `Re-enabled opt-in for ${contact.name} (${contact.phone})`,
      });
    }

    return NextResponse.json({
      success: true,
      optInStatus: optOut ? "OPTED_OUT" : "OPTED_IN",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update opt-out status" }, { status: 500 });
  }
}
