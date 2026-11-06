import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { contact: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const group = await prisma.contactGroup.findUnique({ where: { id: params.id } });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.isSystem) {
      return NextResponse.json({ error: "System groups cannot be deleted" }, { status: 403 });
    }

    await prisma.contactGroup.delete({ where: { id: params.id } });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "DELETE_GROUP",
      details: `Deleted group '${group.name}'`,
    });

    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
