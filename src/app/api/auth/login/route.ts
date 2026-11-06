import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSessionToken, logActivity } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid email or account is inactive" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
    };

    const token = await createSessionToken(authUser);

    await logActivity({
      userId: user.id,
      userName: user.name,
      action: "USER_LOGIN",
      details: `User logged in successfully with role ${user.role}`,
    });

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set("specsbuddy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
