import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        groupMembers: { include: { group: true } },
        consentRecords: { orderBy: { createdAt: "desc" }, take: 5 },
        optOutRecords: { orderBy: { optOutDate: "desc" }, take: 5 },
        campaignRecipients: {
          include: { campaign: { select: { name: true, createdAt: true } } },
          orderBy: { sentAt: "desc" },
          take: 5,
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();
    const { name, phone, email, city, tags, optInStatus, notes, groupIds } = body;

    const existing = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        city: city !== undefined ? city.trim() : undefined,
        tags: tags !== undefined ? tags.trim() : undefined,
        optInStatus: optInStatus !== undefined ? optInStatus : undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
      },
    });

    // If opt-in status changed to OPTED_OUT
    if (optInStatus === "OPTED_OUT" && existing.optInStatus !== "OPTED_OUT") {
      await prisma.optOutRecord.create({
        data: {
          contactId: updated.id,
          phone: updated.phone,
          reason: "ADMIN_SUPPRESSED",
          channel: "WHATSAPP",
        },
      });
    }

    // Update group memberships if provided
    if (groupIds && Array.isArray(groupIds)) {
      await prisma.contactGroupMember.deleteMany({ where: { contactId: params.id } });
      for (const gid of groupIds) {
        await prisma.contactGroupMember.create({
          data: { contactId: params.id, groupId: gid },
        });
      }
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "UPDATE_CONTACT",
      details: `Updated contact ${updated.name} (${updated.phone})`,
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const contact = await prisma.contact.findUnique({ where: { id: params.id } });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id: params.id } });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "DELETE_CONTACT",
      details: `Deleted contact ${contact.name} (${contact.phone})`,
    });

    return NextResponse.json({ success: true, message: "Contact deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
