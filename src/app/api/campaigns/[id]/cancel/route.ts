import { NextRequest, NextResponse } from "next/server";
import campaignEngine from "@/lib/campaigns/campaign-engine";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const result = await campaignEngine.cancelCampaign(params.id);

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "CANCEL_CAMPAIGN",
      details: `Cancelled campaign ID ${params.id}`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel campaign" }, { status: 500 });
  }
}
