import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { testPhone, templateId, headerUrl, bodyVariables } = await request.json();

    if (!testPhone || !templateId) {
      return NextResponse.json({ error: "Test phone number and template ID are required" }, { status: 400 });
    }

    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const result = await metaWhatsAppClient.sendTemplateMessage({
      to: testPhone,
      templateName: template.name,
      languageCode: template.language,
      headerType: template.headerType as any,
      headerUrl: headerUrl || template.headerContent || undefined,
      headerText: template.headerContent || undefined,
      bodyVariables: bodyVariables || ["Test Recipient", "Test City"],
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      isSimulated: result.isSimulated,
      error: result.errorMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send test message" }, { status: 500 });
  }
}
