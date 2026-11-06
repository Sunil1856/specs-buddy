import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, hashPassword, hasPermission, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user || !hasPermission(user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin permission required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser || !hasPermission(authUser.role, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Super Admin permission required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role = "CAMPAIGN_OPERATOR" } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and initial password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: authUser.id,
      userName: authUser.name,
      action: "CREATE_USER",
      details: `Created team member ${newUser.name} with role ${newUser.role}`,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser || !hasPermission(authUser.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, isActive, password } = body;

    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const updateData: any = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await logActivity({
      userId: authUser.id,
      userName: authUser.name,
      action: "UPDATE_USER",
      details: `Updated settings for user ${updatedUser.name} (${updatedUser.email})`,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}
