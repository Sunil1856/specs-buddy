import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
