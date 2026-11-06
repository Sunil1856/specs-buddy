import prisma from "../prisma";
import metaWhatsAppClient from "../whatsapp/meta-client";
import whatsAppWebSessionManager from "../whatsapp/web-session";

export class CampaignEngine {
  private activeCampaigns = new Set<string>();
  private pausedCampaigns = new Set<string>();

  // Trigger immediate or background execution of a campaign
  async dispatchCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        group: {
          include: {
            members: {
              include: { contact: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found" };
    }

    if (!campaign.template) {
      return { success: false, message: "No WhatsApp template associated with this campaign" };
    }

    if (this.activeCampaigns.has(campaignId)) {
      return { success: true, message: "Campaign is already running" };
    }

    // Set campaign to RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "RUNNING",
        startedAt: campaign.startedAt || new Date(),
      },
    });

    this.activeCampaigns.add(campaignId);
    this.pausedCampaigns.delete(campaignId);

    // Run execution asynchronously so the API returns immediately to the UI
    this.executeCampaignLoop(campaignId).catch((err) => {
      console.error(`Error in campaign execution loop [${campaignId}]:`, err);
    });

    return { success: true, message: "Campaign dispatch initiated" };
  }

  // Main campaign processing loop
  private async executeCampaignLoop(campaignId: string) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
        },
      });

      if (!campaign || !campaign.template) return;

      // Parse variable mapping JSON if exists
      let varMappings: Record<string, string> = {};
      try {
        if (campaign.variableMappings) {
          varMappings = JSON.parse(campaign.variableMappings);
        }
      } catch (e) {
        varMappings = { "1": "name", "2": "city" };
      }

      // Fetch active gateway configuration
      const apiCred = await prisma.apiCredential.findFirst({
        where: { provider: "META_WHATSAPP" },
        orderBy: { updatedAt: "desc" },
      });
      const isWhatsAppWeb = apiCred?.gatewayMode === "WHATSAPP_WEB";

      // Fetch queued recipients for this campaign
      const queuedRecipients = await prisma.campaignRecipient.findMany({
        where: {
          campaignId,
          status: "QUEUED",
        },
        include: { contact: true },
        take: 200, // Batch size
      });

      if (queuedRecipients.length === 0) {
        // All recipients processed, check if there are any still queued
        const remaining = await prisma.campaignRecipient.count({
          where: { campaignId, status: "QUEUED" },
        });

        if (remaining === 0) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
          this.activeCampaigns.delete(campaignId);
          return;
        }
      }

      // Process batch
      for (const recipient of queuedRecipients) {
        // Check for pause or cancel
        if (this.pausedCampaigns.has(campaignId)) {
          console.log(`Campaign ${campaignId} paused.`);
          this.activeCampaigns.delete(campaignId);
          return;
        }

        const currentStatus = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { status: true },
        });

        if (currentStatus?.status === "CANCELLED" || currentStatus?.status === "PAUSED") {
          this.activeCampaigns.delete(campaignId);
          return;
        }

        // OPT-OUT SUPPRESSION CHECK (STRICT RULE)
        const isOptedOut =
          recipient.contact.optInStatus !== "OPTED_IN" ||
          (await prisma.optOutRecord.findFirst({ where: { phone: recipient.phone } }));

        if (isOptedOut) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "SUPPRESSED_OPT_OUT",
              errorMessage: "Suppressed: Contact has opted out of marketing broadcasts.",
              failedAt: new Date(),
            },
          });
          continue;
        }

        // Prepare dynamic body variables
        const bodyVariables: string[] = [];
        if (campaign.template.variableSample) {
          try {
            const sampleArr: string[] = JSON.parse(campaign.template.variableSample);
            for (let i = 1; i <= sampleArr.length; i++) {
              const mappedField = varMappings[String(i)] || (i === 1 ? "name" : "city");
              if (mappedField === "name") {
                bodyVariables.push(recipient.customerName || "Valued Customer");
              } else if (mappedField === "city") {
                bodyVariables.push(recipient.contact.city || "your city");
              } else if (mappedField === "phone") {
                bodyVariables.push(recipient.phone);
              } else {
                bodyVariables.push(mappedField); // literal text
              }
            }
          } catch (e) {
            bodyVariables.push(recipient.customerName || "Customer");
          }
        } else {
          bodyVariables.push(recipient.customerName || "Customer");
        }

        // Mark recipient as SENDING
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "SENDING" },
        });

        let result: {
          success: boolean;
          messageId?: string;
          errorCode?: string;
          errorMessage?: string;
          isSimulated?: boolean;
        };

        if (isWhatsAppWeb) {
          // Resolve dynamic variables in body text
          let resolvedBody = campaign.template.bodyText || "";
          bodyVariables.forEach((val, idx) => {
            resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, "g"), val);
          });
          if (campaign.template.headerType === "TEXT" && campaign.template.headerContent) {
            resolvedBody = `*${campaign.template.headerContent}*\n\n${resolvedBody}`;
          }

          const webRes = await whatsAppWebSessionManager.sendMessageViaWeb({
            to: recipient.phone,
            body: resolvedBody,
            mediaUrl: campaign.mediaHeaderUrl || (campaign.template.headerType !== "TEXT" ? campaign.template.headerContent : undefined) || undefined,
            mediaType: campaign.template.headerType === "IMAGE" ? "image" : campaign.template.headerType === "DOCUMENT" ? "document" : campaign.template.headerType === "VIDEO" ? "video" : undefined,
          });

          result = {
            success: webRes.success,
            messageId: webRes.messageId,
            isSimulated: true,
          };
        } else {
          // Dispatch via Official Meta WhatsApp Cloud API
          result = await metaWhatsAppClient.sendTemplateMessage({
            to: recipient.phone,
            templateName: campaign.template.name,
            languageCode: campaign.template.language,
            headerType: campaign.template.headerType as any,
            headerUrl: campaign.mediaHeaderUrl || campaign.template.headerContent || undefined,
            headerText: campaign.template.headerContent || undefined,
            bodyVariables,
          });
        }

        if (result.success && result.messageId) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "SENT",
              metaMessageId: result.messageId,
              sentAt: new Date(),
            },
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { sentCount: { increment: 1 } },
          });

          await prisma.message.create({
            data: {
              metaMessageId: result.messageId,
              phone: recipient.phone,
              direction: "OUTBOUND",
              messageType: "TEMPLATE",
              content: `Template: ${campaign.template.name}`,
              status: "SENT",
              campaignRecipientId: recipient.id,
              timestamp: new Date(),
            },
          });

          // In simulation mode, simulate realistic webhook delivery & read events
          if (result.isSimulated) {
            this.simulateDeliveryAndRead(result.messageId, recipient.id, campaignId);
          }
        } else {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              errorCode: result.errorCode || "API_ERROR",
              errorMessage: result.errorMessage || "Failed to dispatch message",
              failedAt: new Date(),
            },
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { failedCount: { increment: 1 } },
          });
        }

        // Controlled rate limiting backoff (e.g. 100ms per message = 10 msgs/sec safe throttle)
        await new Promise((res) => setTimeout(res, 120));
      }

      // Check if more recipients exist and schedule next batch
      const remainingCount = await prisma.campaignRecipient.count({
        where: { campaignId, status: "QUEUED" },
      });

      if (remainingCount > 0) {
        setTimeout(() => this.executeCampaignLoop(campaignId), 300);
      } else {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        this.activeCampaigns.delete(campaignId);
      }
    } catch (error) {
      console.error(`Fatal error in campaign loop for ${campaignId}:`, error);
      this.activeCampaigns.delete(campaignId);
    }
  }

  // Realistic simulation of WhatsApp delivery and read events
  private simulateDeliveryAndRead(metaMessageId: string, recipientId: string, campaignId: string) {
    // Deliver after 1.5 seconds
    setTimeout(async () => {
      try {
        await prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
          },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { deliveredCount: { increment: 1 } },
        });
        await prisma.message.updateMany({
          where: { metaMessageId },
          data: { status: "DELIVERED" },
        });

        // 75% read probability after 3.5 seconds
        if (Math.random() < 0.75) {
          setTimeout(async () => {
            try {
              await prisma.campaignRecipient.update({
                where: { id: recipientId },
                data: {
                  status: "READ",
                  readAt: new Date(),
                },
              });
              await prisma.campaign.update({
                where: { id: campaignId },
                data: { readCount: { increment: 1 } },
              });
              await prisma.message.updateMany({
                where: { metaMessageId },
                data: { status: "READ" },
              });
            } catch (e) {}
          }, 3500);
        }
      } catch (e) {}
    }, 1500);
  }

  // Pause campaign
  async pauseCampaign(campaignId: string) {
    this.pausedCampaigns.add(campaignId);
    this.activeCampaigns.delete(campaignId);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "PAUSED" },
    });
    return { success: true, message: "Campaign paused" };
  }

  // Resume campaign
  async resumeCampaign(campaignId: string) {
    this.pausedCampaigns.delete(campaignId);
    return this.dispatchCampaign(campaignId);
  }

  // Cancel campaign
  async cancelCampaign(campaignId: string) {
    this.pausedCampaigns.delete(campaignId);
    this.activeCampaigns.delete(campaignId);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED" },
    });
    return { success: true, message: "Campaign cancelled" };
  }

  // Retry eligible failed messages
  async retryFailedMessages(campaignId: string) {
    const failed = await prisma.campaignRecipient.updateMany({
      where: {
        campaignId,
        status: "FAILED",
      },
      data: {
        status: "QUEUED",
        errorCode: null,
        errorMessage: null,
        retryCount: { increment: 1 },
      },
    });

    if (failed.count > 0) {
      await this.dispatchCampaign(campaignId);
    }

    return {
      success: true,
      count: failed.count,
      message: `Re-queued ${failed.count} failed recipients for retry`,
    };
  }
}

export const campaignEngine = new CampaignEngine();
export default campaignEngine;
