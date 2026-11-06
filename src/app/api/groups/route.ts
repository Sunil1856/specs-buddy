import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function GET() {
  try {
    const groups = await prisma.contactGroup.findMany({
      orderBy: { isSystem: "desc" },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          include: {
            contact: {
              select: { optInStatus: true },
            },
          },
        },
      },
    });

    // Compute active opted-in vs opted-out members
    const result = groups.map((g) => {
      const totalMembers = g._count.members;
      const optedInMembers = g.members.filter((m) => m.contact.optInStatus === "OPTED_IN").length;
      const optedOutMembers = totalMembers - optedInMembers;

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        isSystem: g.isSystem,
        createdAt: g.createdAt,
        totalMembers,
        optedInMembers,
        optedOutMembers,
      };
    });

    return NextResponse.json({ groups: result });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const existing = await prisma.contactGroup.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
    }

    const group = await prisma.contactGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isSystem: false,
      },
    });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE_GROUP",
      details: `Created custom group '${group.name}'`,
    });

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create group" }, { status: 500 });
  }
}
