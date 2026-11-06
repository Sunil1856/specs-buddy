import { NextRequest, NextResponse } from "next/server";
import { processWebhookPayload } from "@/lib/whatsapp/webhook-handler";

export async function POST(request: NextRequest) {
  try {
    const { phone, name, messageText } = await request.json();

    if (!phone || !messageText) {
      return NextResponse.json({ error: "Phone and messageText are required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fakeMessageId = `wamid.HBg${Date.now()}SIMINB${Math.random().toString(36).substring(2, 7)}`;

    // Build standard Meta inbound webhook payload
    const simulatedWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_TEST_ID",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919820000000", phone_number_id: "105928374829102" },
                contacts: [{ profile: { name: name || "Customer" }, wa_id: cleanPhone }],
                messages: [
                  {
                    from: cleanPhone,
                    id: fakeMessageId,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    text: { body: messageText },
                    type: "text",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    await processWebhookPayload(simulatedWebhookPayload);

    return NextResponse.json({
      success: true,
      message: "Simulated inbound WhatsApp message processed successfully",
      messageId: fakeMessageId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Simulation failed" }, { status: 500 });
  }
}
