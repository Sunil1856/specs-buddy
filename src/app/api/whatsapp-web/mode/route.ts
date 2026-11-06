import { NextRequest, NextResponse } from "next/server";
import whatsAppWebSessionManager from "@/lib/whatsapp/web-session";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { mode } = await request.json();

    if (mode !== "META_CLOUD_API" && mode !== "WHATSAPP_WEB") {
      return NextResponse.json({ error: "Invalid gateway mode" }, { status: 400 });
    }

    const result = await whatsAppWebSessionManager.setGatewayMode(mode);

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "SWITCH_GATEWAY_MODE",
      details: `Switched WhatsApp dispatch gateway to ${mode}`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to switch mode" }, { status: 500 });
  }
}
