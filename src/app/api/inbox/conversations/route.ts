import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { contactName: { contains: search } },
        { phone: { contains: search } },
        { lastMessage: { contains: search } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            tags: true,
            optInStatus: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    const now = Date.now();
    const formatted = conversations.map((c) => {
      let isWindowActive = false;
      let minutesRemaining = 0;

      if (c.customerServiceWindowExpiresAt) {
        const expiryTime = new Date(c.customerServiceWindowExpiresAt).getTime();
        if (expiryTime > now) {
          isWindowActive = true;
          minutesRemaining = Math.max(0, Math.round((expiryTime - now) / 60000));
        }
      }

      const hoursRemaining = Math.floor(minutesRemaining / 60);
      const minsRemaining = minutesRemaining % 60;

      return {
        ...c,
        serviceWindow: {
          isActive: isWindowActive,
          hoursRemaining,
          minutesRemaining: minsRemaining,
          expiresAt: c.customerServiceWindowExpiresAt,
        },
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
