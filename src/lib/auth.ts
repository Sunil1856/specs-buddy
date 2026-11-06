import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "specs-buddy-super-secret-jwt-key-2026-production-32bytes"
);

export type Role = "SUPER_ADMIN" | "ADMIN" | "MARKETING_MANAGER" | "CAMPAIGN_OPERATOR" | "VIEWER";

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 50,
  ADMIN: 40,
  MARKETING_MANAGER: 30,
  CAMPAIGN_OPERATOR: 20,
  VIEWER: 10,
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch (error) {
    return null;
  }
}

export async function getAuthUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = await verifySessionToken(token);
    if (user) return user;
  }

  // Check auth cookie
  const cookie = request.cookies.get("specsbuddy_token");
  if (cookie?.value) {
    const user = await verifySessionToken(cookie.value);
    if (user) return user;
  }

  return null;
}

export function hasPermission(userRole: Role, minRequiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRequiredRole] || 0);
}

export async function logActivity(params: {
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userName: params.userName || "System",
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
