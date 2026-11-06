import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import campaignEngine from "@/lib/campaigns/campaign-engine";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true, category: true, language: true } },
        group: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();

    const {
      name,
      description,
      groupId,
      templateId,
      mediaHeaderUrl,
      variableMappings,
      scheduledAt,
      timezone = "Asia/Kolkata",
      sendImmediately = false,
    } = body;

    if (!name || !groupId || !templateId) {
      return NextResponse.json(
        { error: "Campaign name, contact group, and approved template are required" },
        { status: 400 }
      );
    }

    // Verify template is APPROVED
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template || template.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved Meta WhatsApp templates can be used in campaigns" },
        { status: 400 }
      );
    }

    // Fetch group members
    const group = await prisma.contactGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { contact: true },
        },
      },
    });

    if (!group || group.members.length === 0) {
      return NextResponse.json(
        { error: "The selected contact group has no members" },
        { status: 400 }
      );
    }

    const campaignStatus = scheduledAt && !sendImmediately ? "SCHEDULED" : "DRAFT";

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        groupId,
        templateId,
        status: campaignStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        timezone,
        mediaHeaderUrl: mediaHeaderUrl || null,
        variableMappings: typeof variableMappings === "string" ? variableMappings : JSON.stringify(variableMappings || {}),
        totalRecipients: group.members.length,
        createdById: user?.id || null,
      },
    });

    // Populate recipients with OPT-OUT SUPPRESSION check
    for (const member of group.members) {
      const contact = member.contact;
      const isOptedOut = contact.optInStatus !== "OPTED_IN";

      await prisma.campaignRecipient.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          phone: contact.phone,
          customerName: contact.name,
          status: isOptedOut ? "SUPPRESSED_OPT_OUT" : "QUEUED",
          errorMessage: isOptedOut ? "Suppressed: Customer opted out" : null,
        },
      });
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "CREATE_CAMPAIGN",
      details: `Created campaign '${campaign.name}' with ${group.members.length} recipients`,
    });

    // If immediate dispatch requested
    if (sendImmediately) {
      await campaignEngine.dispatchCampaign(campaign.id);
    }

    const createdCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        template: true,
        group: true,
      },
    });

    return NextResponse.json({ success: true, campaign: createdCampaign });
  } catch (error: any) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
}
