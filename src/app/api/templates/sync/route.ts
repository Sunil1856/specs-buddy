import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import metaWhatsAppClient from "@/lib/whatsapp/meta-client";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const syncRes = await metaWhatsAppClient.fetchTemplatesFromMeta();

    if (!syncRes.success || !syncRes.templates) {
      return NextResponse.json({ error: syncRes.error || "Failed to fetch templates from Meta" }, { status: 500 });
    }

    let syncedCount = 0;
    for (const t of syncRes.templates) {
      const headerComp = t.components?.find((c: any) => c.type === "HEADER");
      const bodyComp = t.components?.find((c: any) => c.type === "BODY");
      const footerComp = t.components?.find((c: any) => c.type === "FOOTER");
      const buttonsComp = t.components?.find((c: any) => c.type === "BUTTONS");

      await prisma.messageTemplate.upsert({
        where: { name: t.name },
        update: {
          category: t.category,
          language: t.language,
          status: t.status,
          rejectionReason: t.rejected_reason || null,
          lastSyncedAt: new Date(),
        },
        create: {
          name: t.name,
          metaTemplateId: t.id,
          category: t.category,
          language: t.language,
          status: t.status,
          rejectionReason: t.rejected_reason || null,
          headerType: headerComp?.format || "NONE",
          headerContent: headerComp?.text || null,
          bodyText: bodyComp?.text || "Template content",
          footerText: footerComp?.text || null,
          buttons: buttonsComp ? JSON.stringify(buttonsComp.buttons) : null,
          lastSyncedAt: new Date(),
        },
      });
      syncedCount++;
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "SYNC_TEMPLATES",
      details: `Synced ${syncedCount} templates from Meta WhatsApp Business Account`,
    });

    const updatedTemplates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: syncedCount,
      templates: updatedTemplates,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Template sync failed" }, { status: 500 });
  }
}
