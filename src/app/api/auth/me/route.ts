import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "User not found or disabled" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
