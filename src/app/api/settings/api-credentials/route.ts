import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";
import { getAuthUserFromRequest, hasPermission, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

function maskSecret(val?: string | null): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return `••••••••••••••••${val.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const creds = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });

    if (!creds) {
      return NextResponse.json({
        credentials: {
          appId: "",
          wabaId: "",
          phoneNumberId: "",
          accessToken: "",
          webhookVerifyToken: "specs_buddy_verify_token_2026",
          appSecret: "",
          isTestMode: true,
          qualityRating: "GREEN",
          messagingLimit: "TIER_1_1K",
          status: "DISCONNECTED",
        },
      });
    }

    return NextResponse.json({
      credentials: {
        id: creds.id,
        appId: creds.appId,
        wabaId: creds.wabaId,
        phoneNumberId: creds.phoneNumberId,
        accessTokenMasked: maskSecret(creds.accessToken),
        hasAccessToken: Boolean(creds.accessToken),
        webhookVerifyToken: creds.webhookVerifyToken,
        appSecretMasked: maskSecret(creds.appSecret),
        hasAppSecret: Boolean(creds.appSecret),
        isTestMode: creds.isTestMode,
        qualityRating: creds.qualityRating,
        messagingLimit: creds.messagingLimit,
        status: creds.status,
        lastTestedAt: creds.lastTestedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (user && !hasPermission(user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin permission required" }, { status: 403 });
    }

    const body = await request.json();
    const { appId, wabaId, phoneNumberId, accessToken, webhookVerifyToken, appSecret, isTestMode } = body;

    const existing = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });

    const updateData: any = {
      appId: appId !== undefined ? appId : existing?.appId,
      wabaId: wabaId !== undefined ? wabaId : existing?.wabaId,
      phoneNumberId: phoneNumberId !== undefined ? phoneNumberId : existing?.phoneNumberId,
      webhookVerifyToken: webhookVerifyToken !== undefined ? webhookVerifyToken : existing?.webhookVerifyToken,
      isTestMode: isTestMode !== undefined ? isTestMode : existing?.isTestMode,
    };

    // Only update token/secret if explicitly provided (not masked)
    if (accessToken && !accessToken.includes("••••")) {
      updateData.accessToken = accessToken.trim();
    }
    if (appSecret && !appSecret.includes("••••")) {
      updateData.appSecret = appSecret.trim();
    }

    let saved;
    if (existing) {
      saved = await prisma.apiCredential.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      saved = await prisma.apiCredential.create({
        data: {
          id: "default-meta-credential",
          provider: "META_WHATSAPP",
          ...updateData,
        },
      });
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name || "Admin",
      action: "UPDATE_API_CREDENTIALS",
      details: `Updated Meta WhatsApp API credentials (Test Mode: ${saved.isTestMode})`,
    });

    return NextResponse.json({ success: true, credentials: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update credentials" }, { status: 500 });
  }
}

// POST endpoint: Test Connection live against Meta Cloud API
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json().catch(() => ({}));

    // Perform live connection test
    const testResult = await metaWhatsAppClient.testConnection(body.customConfig);

    const existing = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.apiCredential.update({
        where: { id: existing.id },
        data: {
          status: testResult.success ? "CONNECTED" : "ERROR",
          qualityRating: testResult.qualityRating || existing.qualityRating,
          messagingLimit: testResult.messagingLimit || existing.messagingLimit,
          lastTestedAt: new Date(),
        },
      });
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "TEST_API_CONNECTION",
      details: `Connection test result: ${testResult.success ? "SUCCESS" : "FAILED (" + testResult.error + ")"}`,
    });

    return NextResponse.json(testResult);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Connection test failed" }, { status: 500 });
  }
}
