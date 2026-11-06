import { NextRequest, NextResponse } from "next/server";
import whatsAppWebSessionManager from "@/lib/whatsapp/web-session";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await whatsAppWebSessionManager.getSessionState();
    return NextResponse.json({ session: state });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();
    const { action, phone, pushName } = body;

    if (action === "GENERATE_QR") {
      const result = await whatsAppWebSessionManager.generateQrCode();
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "PAIR_DEVICE") {
      if (!phone) {
        return NextResponse.json({ error: "Phone number required to link device" }, { status: 400 });
      }

      const updatedState = await whatsAppWebSessionManager.pairDevice({ phone, pushName });

      await logActivity({
        userId: user?.id,
        userName: user?.name,
        action: "LINK_WHATSAPP_WEB",
        details: `Linked WhatsApp Web device for phone ${phone}`,
      });

      return NextResponse.json({ success: true, session: updatedState });
    }

    if (action === "DISCONNECT") {
      const updatedState = await whatsAppWebSessionManager.disconnectSession();

      await logActivity({
        userId: user?.id,
        userName: user?.name,
        action: "UNLINK_WHATSAPP_WEB",
        details: "Unlinked WhatsApp Web device session",
      });

      return NextResponse.json({ success: true, session: updatedState });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Session error" }, { status: 500 });
  }
}
