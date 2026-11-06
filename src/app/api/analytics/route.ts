import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30"; // 7, 30, all
    const shouldExport = searchParams.get("export") === "csv";

    const where: any = {};
    if (range !== "all") {
      const days = parseInt(range);
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sinceDate };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true, category: true } },
        group: { select: { name: true } },
      },
    });

    const detailedCampaigns = campaigns.map((c) => {
      const deliveryRate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
      const readRate = c.deliveredCount > 0 ? Math.round((c.readCount / c.deliveredCount) * 100) : 0;
      const failRate = c.sentCount > 0 ? Math.round((c.failedCount / c.sentCount) * 100) : 0;

      return {
        id: c.id,
        name: c.name,
        templateName: c.template?.name || "N/A",
        category: c.template?.category || "MARKETING",
        groupName: c.group?.name || "All",
        status: c.status,
        totalRecipients: c.totalRecipients,
        sentCount: c.sentCount,
        deliveredCount: c.deliveredCount,
        readCount: c.readCount,
        failedCount: c.failedCount,
        deliveryRate,
        readRate,
        failRate,
        createdAt: c.createdAt.toISOString().slice(0, 10),
      };
    });

    // If CSV export is requested
    if (shouldExport) {
      const exportRows = detailedCampaigns.map((c) => ({
        "Campaign ID": c.id,
        "Campaign Name": c.name,
        "Template": c.templateName,
        "Category": c.category,
        "Target Group": c.groupName,
        "Status": c.status,
        "Total Audience": c.totalRecipients,
        "Sent": c.sentCount,
        "Delivered": c.deliveredCount,
        "Read": c.readCount,
        "Failed": c.failedCount,
        "Delivery Rate (%)": `${c.deliveryRate}%`,
        "Read Rate (%)": `${c.readRate}%`,
        "Created Date": c.createdAt,
      }));

      const csv = Papa.unparse(exportRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="specs_buddy_analytics_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Aggregate totals
    const totalSent = detailedCampaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalDelivered = detailedCampaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    const totalRead = detailedCampaigns.reduce((acc, c) => acc + c.readCount, 0);
    const totalFailed = detailedCampaigns.reduce((acc, c) => acc + c.failedCount, 0);

    // Query error breakdowns from campaign recipients
    const failedRecipients = await prisma.campaignRecipient.findMany({
      where: {
        status: "FAILED",
        errorCode: { not: null },
      },
      select: { errorCode: true, errorMessage: true },
    });

    const errorCounts: Record<string, { count: number; sampleMessage: string }> = {};
    for (const f of failedRecipients) {
      const code = f.errorCode || "OTHER";
      if (!errorCounts[code]) {
        errorCounts[code] = { count: 0, sampleMessage: f.errorMessage || "Undeliverable" };
      }
      errorCounts[code].count++;
    }

    // Default Meta error labels if none yet recorded
    const errorBreakdown = Object.keys(errorCounts).length > 0
      ? Object.entries(errorCounts).map(([code, data]) => ({
          code,
          count: data.count,
          description: data.sampleMessage,
        }))
      : [
          { code: "131026", count: 0, description: "Message undeliverable to phone" },
          { code: "131047", count: 0, description: "Re-engagement window expired" },
          { code: "130429", count: 0, description: "Meta rate limit exceeded" },
          { code: "130472", count: 0, description: "User opted out of marketing" },
        ];

    return NextResponse.json({
      summary: {
        totalCampaigns: detailedCampaigns.length,
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
        avgDeliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
        avgReadRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
      },
      campaigns: detailedCampaigns,
      errorBreakdown,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
