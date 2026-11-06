import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, processWebhookPayload } from "@/lib/whatsapp/webhook-handler";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";

// Meta Webhook Verification Challenge (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = await metaWhatsAppClient.loadConfig();
  const expectedToken = config.webhookVerifyToken || "specs_buddy_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("✅ Meta WhatsApp Webhook verified successfully!");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("⚠️ Meta Webhook verification failed. Token mismatch.");
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta Webhook Events & Status Callbacks (POST)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify HMAC-SHA256 signature
    const isValidSignature = await verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn("⚠️ Invalid webhook HMAC SHA-256 signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Process asynchronously so we respond to Meta within 3 seconds
    processWebhookPayload(payload).catch((err) => {
      console.error("Webhook processing error:", err);
    });

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
