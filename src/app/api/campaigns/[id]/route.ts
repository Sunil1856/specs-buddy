import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        group: true,
        createdBy: { select: { name: true, email: true } },
        recipients: {
          orderBy: { sentAt: "desc" },
          take: 50,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Calculate rates
    const deliveryRate = campaign.sentCount > 0 ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100) : 0;
    const readRate = campaign.deliveredCount > 0 ? Math.round((campaign.readCount / campaign.deliveredCount) * 100) : 0;

    return NextResponse.json({
      campaign: {
        ...campaign,
        deliveryRate,
        readRate,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();
    const { name, description, scheduledAt, timezone, mediaHeaderUrl } = body;

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        timezone,
        mediaHeaderUrl,
      },
    });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "UPDATE_CAMPAIGN",
      details: `Updated campaign details '${campaign.name}'`,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "RUNNING") {
      return NextResponse.json({ error: "Cannot delete a currently running campaign. Cancel it first." }, { status: 400 });
    }

    await prisma.campaign.delete({ where: { id: params.id } });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "DELETE_CAMPAIGN",
      details: `Deleted campaign '${campaign.name}'`,
    });

    return NextResponse.json({ success: true, message: "Campaign deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
