import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Normalize phone to E.164 format (+91...)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    return "+91" + digits; // Default Indian 10-digit
  }
  return "+" + digits;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const groupId = searchParams.get("groupId") || "";
    const optInStatus = searchParams.get("optInStatus") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (optInStatus) {
      where.optInStatus = optInStatus;
    }

    if (groupId) {
      where.groupMembers = {
        some: { groupId },
      };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          groupMembers: {
            include: { group: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Contacts list error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();

    const { name, phone, email, city, tags, optInStatus, consentSource, groupIds, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone number are required" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    // Duplicate check
    const existing = await prisma.contact.findUnique({
      where: { phone: normalized },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Contact with phone number ${normalized} already exists (${existing.name})` },
        { status: 409 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        phone: normalized,
        email: email?.trim() || null,
        city: city?.trim() || null,
        tags: tags?.trim() || "",
        optInStatus: optInStatus || "OPTED_IN",
        consentSource: consentSource || "MANUAL",
        consentDate: new Date(),
        notes: notes?.trim() || null,
      },
    });

    // Record consent
    await prisma.consentRecord.create({
      data: {
        contactId: contact.id,
        source: consentSource || "MANUAL",
        proofDetails: `Manually added by user ${user?.name || "Admin"}`,
      },
    });

    // Handle Opt-Out if specified
    if (optInStatus === "OPTED_OUT") {
      await prisma.optOutRecord.create({
        data: {
          contactId: contact.id,
          phone: contact.phone,
          reason: "ADMIN_SUPPRESSED",
          channel: "WHATSAPP",
        },
      });
    }

    // Attach to groups
    if (groupIds && Array.isArray(groupIds)) {
      for (const gid of groupIds) {
        await prisma.contactGroupMember.create({
          data: { contactId: contact.id, groupId: gid },
        });
      }
    } else {
      // Auto-assign to 'All Customers'
      const allGroup = await prisma.contactGroup.findUnique({ where: { name: "All Customers" } });
      if (allGroup) {
        await prisma.contactGroupMember.create({
          data: { contactId: contact.id, groupId: allGroup.id },
        });
      }
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE_CONTACT",
      details: `Created contact ${contact.name} (${contact.phone})`,
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("Create contact error:", error);
    return NextResponse.json({ error: error.message || "Failed to create contact" }, { status: 500 });
  }
}
