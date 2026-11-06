import { NextRequest, NextResponse } from "next/server";
import campaignEngine from "@/lib/campaigns/campaign-engine";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const result = await campaignEngine.dispatchCampaign(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "DISPATCH_CAMPAIGN",
      details: `Dispatched campaign ID ${params.id}`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Dispatch failed" }, { status: 500 });
  }
}
