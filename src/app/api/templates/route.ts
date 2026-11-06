import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();

    const {
      name,
      category,
      language = "en_US",
      headerType = "NONE",
      headerContent,
      bodyText,
      footerText,
      buttons,
      variableSample,
    } = body;

    if (!name || !category || !bodyText) {
      return NextResponse.json({ error: "Template name, category, and body text are required" }, { status: 400 });
    }

    // Clean name: Meta requires lowercase letters, numbers, and underscores only
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const existing = await prisma.messageTemplate.findUnique({ where: { name: cleanName } });
    if (existing) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    // Prepare components for Meta submission
    const components: any[] = [];
    if (headerType !== "NONE") {
      components.push({
        type: "HEADER",
        format: headerType,
        text: headerType === "TEXT" ? headerContent : undefined,
      });
    }

    components.push({
      type: "BODY",
      text: bodyText,
    });

    if (footerText) {
      components.push({
        type: "FOOTER",
        text: footerText,
      });
    }

    // Submit to Meta
    const metaRes = await metaWhatsAppClient.createTemplateOnMeta({
      name: cleanName,
      category,
      language,
      components,
    });

    const template = await prisma.messageTemplate.create({
      data: {
        name: cleanName,
        metaTemplateId: metaRes.templateId || `meta_tpl_${Date.now()}`,
        category,
        language,
        status: metaRes.success ? "APPROVED" : "PENDING",
        headerType,
        headerContent: headerContent || null,
        bodyText,
        footerText: footerText || null,
        buttons: typeof buttons === "string" ? buttons : JSON.stringify(buttons || []),
        variableSample: typeof variableSample === "string" ? variableSample : JSON.stringify(variableSample || []),
        lastSyncedAt: new Date(),
      },
    });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE_TEMPLATE",
      details: `Created template '${template.name}' in category ${template.category}`,
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: error.message || "Failed to create template" }, { status: 500 });
  }
}
