import prisma from "../lib/prisma";
import campaignEngine from "../lib/campaigns/campaign-engine";

async function checkScheduledCampaigns() {
  try {
    const now = new Date();
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now,
        },
      },
    });

    for (const campaign of dueCampaigns) {
      console.log(`⏰ Scheduler: Dispathing due campaign [${campaign.id}] '${campaign.name}'`);
      await campaignEngine.dispatchCampaign(campaign.id);
    }
  } catch (error) {
    console.error("Scheduler poll error:", error);
  }
}

async function startWorker() {
  console.log("🚀 SPECS BUDDY Background Campaign Worker started.");
  console.log("Monitoring scheduled campaigns and queue processing...");

  // Poll every 10 seconds
  setInterval(checkScheduledCampaigns, 10000);
  await checkScheduledCampaigns();
}

// If executed directly via CLI
if (require.main === module) {
  startWorker();
}

export { startWorker, checkScheduledCampaigns };
