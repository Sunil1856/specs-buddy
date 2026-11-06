import prisma from "../prisma";

export interface MetaConfig {
  appId?: string;
  wabaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  appSecret?: string;
  webhookVerifyToken?: string;
  isTestMode?: boolean;
}

export interface SendTemplateParams {
  to: string; // E.164 phone number
  templateName: string;
  languageCode?: string;
  headerType?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  headerUrl?: string;
  headerText?: string;
  bodyVariables?: string[];
  buttonVariables?: { index: number; subType: "quick_reply" | "url"; payload?: string; urlSuffix?: string }[];
}

export interface SendTextParams {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface SendMediaParams {
  to: string;
  mediaType: "image" | "document" | "video";
  mediaUrl: string;
  caption?: string;
  fileName?: string;
}

export interface MetaApiResponse {
  success: boolean;
  messageId?: string;
  waId?: string;
  isSimulated?: boolean;
  errorCode?: string;
  errorMessage?: string;
  raw?: any;
}

const GRAPH_API_BASE = "https://graph.facebook.com/v20.0";

export class MetaWhatsAppClient {
  private config: MetaConfig | null = null;

  async loadConfig(): Promise<MetaConfig> {
    if (this.config) return this.config;

    const dbCreds = await prisma.apiCredential.findFirst({
      where: { provider: "META_WHATSAPP" },
      orderBy: { updatedAt: "desc" },
    });

    this.config = {
      appId: dbCreds?.appId || process.env.META_APP_ID || "",
      wabaId: dbCreds?.wabaId || process.env.META_WABA_ID || "",
      phoneNumberId: dbCreds?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || "",
      accessToken: dbCreds?.accessToken || process.env.META_ACCESS_TOKEN || "",
      appSecret: dbCreds?.appSecret || process.env.META_APP_SECRET || "",
      webhookVerifyToken: dbCreds?.webhookVerifyToken || process.env.META_WEBHOOK_VERIFY_TOKEN || "specs_buddy_verify_token_2026",
      isTestMode: dbCreds?.isTestMode ?? (process.env.META_TEST_MODE === "true"),
    };

    return this.config;
  }

  // Format clean E.164 number without '+' or special symbols for Meta API
  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, "");
  }

  // Send WhatsApp Template Message
  async sendTemplateMessage(params: SendTemplateParams): Promise<MetaApiResponse> {
    const config = await this.loadConfig();
    const cleanPhone = this.cleanPhoneNumber(params.to);

    // If Test Mode is enabled or credentials are placeholders, simulate response
    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      const simulatedId = `wamid.HBg${Date.now()}SIM${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      return {
        success: true,
        messageId: simulatedId,
        waId: cleanPhone,
        isSimulated: true,
        raw: {
          messaging_product: "whatsapp",
          contacts: [{ input: cleanPhone, wa_id: cleanPhone }],
          messages: [{ id: simulatedId }],
        },
      };
    }

    // Build official Meta Cloud API components payload
    const components: any[] = [];

    // Header component
    if (params.headerType && params.headerType !== "NONE") {
      if (params.headerType === "TEXT" && params.headerText) {
        components.push({
          type: "header",
          parameters: [{ type: "text", text: params.headerText }],
        });
      } else if (params.headerType === "IMAGE" && params.headerUrl) {
        components.push({
          type: "header",
          parameters: [{ type: "image", image: { link: params.headerUrl } }],
        });
      } else if (params.headerType === "DOCUMENT" && params.headerUrl) {
        components.push({
          type: "header",
          parameters: [{ type: "document", document: { link: params.headerUrl } }],
        });
      } else if (params.headerType === "VIDEO" && params.headerUrl) {
        components.push({
          type: "header",
          parameters: [{ type: "video", video: { link: params.headerUrl } }],
        });
      }
    }

    // Body component with variable parameters
    if (params.bodyVariables && params.bodyVariables.length > 0) {
      components.push({
        type: "body",
        parameters: params.bodyVariables.map((val) => ({
          type: "text",
          text: String(val || ""),
        })),
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode || "en_US",
        },
        components: components.length > 0 ? components : undefined,
      },
    };

    try {
      const response = await fetch(`${GRAPH_API_BASE}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          errorCode: String(data.error?.code || response.status),
          errorMessage: data.error?.message || "WhatsApp Cloud API error",
          raw: data,
        };
      }

      const messageId = data.messages?.[0]?.id;
      const waId = data.contacts?.[0]?.wa_id;

      return {
        success: true,
        messageId,
        waId,
        isSimulated: false,
        raw: data,
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: error.message || "Failed to reach Meta WhatsApp API",
      };
    }
  }

  // Send Free-Form Text Message (Inside 24-hr Customer Service Window)
  async sendTextMessage(params: SendTextParams): Promise<MetaApiResponse> {
    const config = await this.loadConfig();
    const cleanPhone = this.cleanPhoneNumber(params.to);

    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      const simulatedId = `wamid.HBg${Date.now()}SIM${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      return {
        success: true,
        messageId: simulatedId,
        waId: cleanPhone,
        isSimulated: true,
        raw: {
          messaging_product: "whatsapp",
          contacts: [{ input: cleanPhone, wa_id: cleanPhone }],
          messages: [{ id: simulatedId }],
        },
      };
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: params.previewUrl ?? false,
        body: params.body,
      },
    };

    try {
      const response = await fetch(`${GRAPH_API_BASE}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        return {
          success: false,
          errorCode: String(data.error?.code || response.status),
          errorMessage: data.error?.message || "Failed to send text message",
          raw: data,
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        waId: data.contacts?.[0]?.wa_id,
        isSimulated: false,
        raw: data,
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: error.message || "Network error sending message",
      };
    }
  }

  // Send Media Message
  async sendMediaMessage(params: SendMediaParams): Promise<MetaApiResponse> {
    const config = await this.loadConfig();
    const cleanPhone = this.cleanPhoneNumber(params.to);

    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      const simulatedId = `wamid.HBg${Date.now()}SIM${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      return {
        success: true,
        messageId: simulatedId,
        waId: cleanPhone,
        isSimulated: true,
      };
    }

    const mediaObject: any = { link: params.mediaUrl };
    if (params.caption) mediaObject.caption = params.caption;
    if (params.fileName && params.mediaType === "document") mediaObject.filename = params.fileName;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: params.mediaType,
      [params.mediaType]: mediaObject,
    };

    try {
      const response = await fetch(`${GRAPH_API_BASE}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        return {
          success: false,
          errorCode: String(data.error?.code || response.status),
          errorMessage: data.error?.message || "Failed to send media",
          raw: data,
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        waId: data.contacts?.[0]?.wa_id,
        isSimulated: false,
        raw: data,
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: error.message || "Network error",
      };
    }
  }

  // Test API Connection & Retrieve Account Quality / Messaging Limit
  async testConnection(customConfig?: MetaConfig): Promise<{
    success: boolean;
    phoneDetails?: any;
    qualityRating?: string;
    messagingLimit?: string;
    error?: string;
    isSimulated?: boolean;
  }> {
    const config = customConfig || (await this.loadConfig());

    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      return {
        success: true,
        isSimulated: true,
        qualityRating: "GREEN",
        messagingLimit: "TIER_1_1K",
        phoneDetails: {
          verified_name: "SPECS BUDDY Official",
          display_phone_number: "+91 98200 00000",
          quality_rating: "GREEN",
          code_verification_status: "VERIFIED",
        },
      };
    }

    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/${config.phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,throughput`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: Failed to verify Phone Number ID`,
        };
      }

      return {
        success: true,
        phoneDetails: data,
        qualityRating: data.quality_rating || "GREEN",
        messagingLimit: "TIER_1_1K",
        isSimulated: false,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to connect to Meta Graph API",
      };
    }
  }

  // Fetch Message Templates from WhatsApp Business Account
  async fetchTemplatesFromMeta(): Promise<{ success: boolean; templates?: any[]; error?: string }> {
    const config = await this.loadConfig();

    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      // In test mode, return local database templates
      const localTemplates = await prisma.messageTemplate.findMany();
      return {
        success: true,
        templates: localTemplates.map((t) => ({
          name: t.name,
          category: t.category,
          language: t.language,
          status: t.status,
          id: t.metaTemplateId || t.id,
          components: [
            t.headerType !== "NONE" ? { type: "HEADER", format: t.headerType, text: t.headerContent } : null,
            { type: "BODY", text: t.bodyText },
            t.footerText ? { type: "FOOTER", text: t.footerText } : null,
          ].filter(Boolean),
        })),
      };
    }

    try {
      const response = await fetch(`${GRAPH_API_BASE}/${config.wabaId}/message_templates?limit=100`, {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || "Failed to fetch templates from Meta",
        };
      }

      return {
        success: true,
        templates: data.data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Network error fetching templates",
      };
    }
  }

  // Create / Submit a new template to Meta
  async createTemplateOnMeta(params: {
    name: string;
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
    language: string;
    components: any[];
  }): Promise<{ success: boolean; templateId?: string; error?: string }> {
    const config = await this.loadConfig();

    if (config.isTestMode || !config.accessToken || config.accessToken.includes("sample")) {
      const simId = `meta_tpl_${Date.now()}`;
      return {
        success: true,
        templateId: simId,
      };
    }

    try {
      const response = await fetch(`${GRAPH_API_BASE}/${config.wabaId}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || "Failed to create template on Meta",
        };
      }

      return {
        success: true,
        templateId: data.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create template",
      };
    }
  }
}

export const metaWhatsAppClient = new MetaWhatsAppClient();
export default metaWhatsAppClient;
