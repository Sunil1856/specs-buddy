import { NextRequest, NextResponse } from "next/server";
import campaignEngine from "@/lib/campaigns/campaign-engine";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);
    const result = await campaignEngine.retryFailedMessages(params.id);

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "RETRY_FAILED_MESSAGES",
      details: `Retried failed messages for campaign ID ${params.id} (${result.count} queued)`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retry" }, { status: 500 });
  }
}
