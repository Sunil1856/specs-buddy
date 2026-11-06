import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SPECS BUDDY database...");

  // 1. Create Default Users with different roles
  const hashedPassword = await bcrypt.hash("SpecsBuddy@2026", 10);
  const managerPassword = await bcrypt.hash("Manager@2026", 10);
  const operatorPassword = await bcrypt.hash("Operator@2026", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@specsbuddy.com" },
    update: {},
    create: {
      name: "Specs Buddy Super Admin",
      email: "admin@specsbuddy.com",
      passwordHash: hashedPassword,
      role: "SUPER_ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@specsbuddy.com" },
    update: {},
    create: {
      name: "Rohit Verma (Marketing Lead)",
      email: "manager@specsbuddy.com",
      passwordHash: managerPassword,
      role: "MARKETING_MANAGER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@specsbuddy.com" },
    update: {},
    create: {
      name: "Pooja Sharma (Campaign Exec)",
      email: "operator@specsbuddy.com",
      passwordHash: operatorPassword,
      role: "CAMPAIGN_OPERATOR",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Seeded Users");

  // 2. Create Standard Contact Groups
  const groupNames = [
    { name: "All Customers", desc: "Master list of all opt-in eyewear customers", system: true },
    { name: "New Customers", desc: "First-time visitors and newly registered customers", system: true },
    { name: "Existing Customers", desc: "Active customers with past prescription orders", system: true },
    { name: "VIP Customers", desc: "High lifetime value customers and designer frame collectors", system: true },
    { name: "Repeat Buyers", desc: "Customers who made 2 or more purchases in the last 12 months", system: true },
    { name: "Blue Light Lens Buyers", desc: "IT professionals and students who bought computer glasses", system: false },
    { name: "Contact Lens Users", desc: "Monthly and daily disposable contact lens subscribers", system: false },
  ];

  const groups: Record<string, any> = {};
  for (const g of groupNames) {
    groups[g.name] = await prisma.contactGroup.upsert({
      where: { name: g.name },
      update: {},
      create: {
        name: g.name,
        description: g.desc,
        isSystem: g.system,
      },
    });
  }
  console.log("✅ Seeded Contact Groups");

  // 3. Create Sample Contacts (SPECS BUDDY Eyewear Customers)
  const sampleContacts = [
    {
      name: "Aarav Mehta",
      phone: "+919820011221",
      email: "aarav.mehta@example.com",
      city: "Mumbai",
      tags: "vip,designer_frames,progressive_lenses",
      optInStatus: "OPTED_IN",
      consentSource: "STORE_PURCHASE",
      consentDate: new Date("2026-08-15"),
      notes: "Preferred brand: Ray-Ban Titanium. High prescription index 1.74.",
      groups: ["All Customers", "VIP Customers", "Repeat Buyers"],
    },
    {
      name: "Priya Sundaram",
      phone: "+919845012345",
      email: "priya.s@example.com",
      city: "Bengaluru",
      tags: "blue_light,computer_glasses,student",
      optInStatus: "OPTED_IN",
      consentSource: "WEBSITE",
      consentDate: new Date("2026-09-01"),
      notes: "Purchased SPECS BUDDY Zero-Glare anti-fatigue lenses.",
      groups: ["All Customers", "New Customers", "Blue Light Lens Buyers"],
    },
    {
      name: "Vikram Malhotra",
      phone: "+919811022334",
      email: "vikram.m@example.com",
      city: "Delhi NCR",
      tags: "vip,polarized_sunglasses,aviator",
      optInStatus: "OPTED_IN",
      consentSource: "STORE_PURCHASE",
      consentDate: new Date("2026-07-20"),
      notes: "Enquiring about photochromic transition lenses.",
      groups: ["All Customers", "VIP Customers", "Existing Customers"],
    },
    {
      name: "Sneha Patel",
      phone: "+919724033445",
      email: "sneha.patel@example.com",
      city: "Ahmedabad",
      tags: "contact_lenses,monthly_disposable",
      optInStatus: "OPTED_IN",
      consentSource: "WHATSAPP_INBOUND",
      consentDate: new Date("2026-09-12"),
      notes: "Re-orders Acuvue Oasys lenses every 3 months.",
      groups: ["All Customers", "Repeat Buyers", "Contact Lens Users"],
    },
    {
      name: "Rohan Kapoor",
      phone: "+919830044556",
      email: "rohan.k@example.com",
      city: "Kolkata",
      tags: "anti_glare,driving_specs",
      optInStatus: "OPTED_IN",
      consentSource: "WEBSITE",
      consentDate: new Date("2026-09-18"),
      notes: "Night drive clip-on magnetic frame owner.",
      groups: ["All Customers", "Existing Customers"],
    },
    {
      name: "Ananya Deshmukh",
      phone: "+919850055667",
      email: "ananya.d@example.com",
      city: "Pune",
      tags: "rimless,titanium_frames",
      optInStatus: "OPTED_IN",
      consentSource: "STORE_PURCHASE",
      consentDate: new Date("2026-08-05"),
      notes: "Annual eye examination scheduled.",
      groups: ["All Customers", "Existing Customers", "VIP Customers"],
    },
    {
      name: "Karan Johar Sharma",
      phone: "+919871066778",
      email: "karan.js@example.com",
      city: "Gurugram",
      tags: "opted_out_customer",
      optInStatus: "OPTED_OUT", // Important test case: strictly suppressed from marketing
      consentSource: "MANUAL",
      consentDate: new Date("2026-05-10"),
      notes: "Requested opt-out via WhatsApp reply 'STOP' on 2026-09-02.",
      groups: ["All Customers"],
    },
    {
      name: "Meera Nair",
      phone: "+919847077889",
      email: "meera.nair@example.com",
      city: "Kochi",
      tags: "cat_eye,acetate_frames,fashion",
      optInStatus: "OPTED_IN",
      consentSource: "STORE_PURCHASE",
      consentDate: new Date("2026-09-25"),
      notes: "Loves vintage tortoiseshell frames.",
      groups: ["All Customers", "New Customers"],
    },
    {
      name: "Devendra Singh",
      phone: "+919414088990",
      email: "devendra.s@example.com",
      city: "Jaipur",
      tags: "progressive_lenses,reading_glasses",
      optInStatus: "OPTED_IN",
      consentSource: "STORE_PURCHASE",
      consentDate: new Date("2026-08-30"),
      notes: "Prescription verification done in Jaipur flagship store.",
      groups: ["All Customers", "Existing Customers", "Repeat Buyers"],
    },
    {
      name: "Tanvi Iyer",
      phone: "+919884099001",
      email: "tanvi.iyer@example.com",
      city: "Chennai",
      tags: "blue_light,kids_eyewear",
      optInStatus: "OPTED_IN",
      consentSource: "WEBSITE",
      consentDate: new Date("2026-10-02"),
      notes: "Interested in unbreakable silicone frames for kids.",
      groups: ["All Customers", "New Customers", "Blue Light Lens Buyers"],
    },
  ];

  for (const sc of sampleContacts) {
    const contact = await prisma.contact.upsert({
      where: { phone: sc.phone },
      update: {},
      create: {
        name: sc.name,
        phone: sc.phone,
        email: sc.email,
        city: sc.city,
        tags: sc.tags,
        optInStatus: sc.optInStatus,
        consentSource: sc.consentSource,
        consentDate: sc.consentDate,
        notes: sc.notes,
      },
    });

    // Add consent record
    await prisma.consentRecord.create({
      data: {
        contactId: contact.id,
        source: sc.consentSource,
        optInDate: sc.consentDate,
        proofDetails: `Recorded at ${sc.consentSource} for ${sc.phone}`,
      },
    });

    // If opted out, create opt_out_record
    if (sc.optInStatus === "OPTED_OUT") {
      await prisma.optOutRecord.create({
        data: {
          contactId: contact.id,
          phone: sc.phone,
          reason: "REPLIED_STOP",
          channel: "WHATSAPP",
          optOutDate: new Date("2026-09-02"),
        },
      });
    }

    // Connect to groups
    for (const gName of sc.groups) {
      if (groups[gName]) {
        await prisma.contactGroupMember.upsert({
          where: {
            contactId_groupId: {
              contactId: contact.id,
              groupId: groups[gName].id,
            },
          },
          update: {},
          create: {
            contactId: contact.id,
            groupId: groups[gName].id,
          },
        });
      }
    }
  }
  console.log("✅ Seeded Contacts & Groups Memberships");

  // 4. Create Meta WhatsApp Approved Templates
  const templates = [
    {
      name: "specs_buddy_welcome_offer",
      metaTemplateId: "meta_tpl_welcome_9918",
      category: "MARKETING",
      language: "en_US",
      status: "APPROVED",
      headerType: "IMAGE",
      headerContent: "https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80",
      bodyText: "Hello {{1}}, welcome to SPECS BUDDY! 👓 Enjoy an exclusive 20% discount on your first pair of designer frames or prescription lenses in {{2}}. Visit your nearest store or explore our catalogue online. Use code: WELCOME20 at checkout.\n\nReply STOP to unsubscribe.",
      footerText: "SPECS BUDDY Eyewear Suite",
      buttons: JSON.stringify([
        { type: "URL", text: "Explore Frames", url: "https://specsbuddy.com/catalog" },
        { type: "QUICK_REPLY", text: "Book Eye Test" },
      ]),
      variableSample: JSON.stringify(["Aarav", "Mumbai"]),
    },
    {
      name: "specs_buddy_eye_test_reminder",
      metaTemplateId: "meta_tpl_checkup_4412",
      category: "UTILITY",
      language: "en_US",
      status: "APPROVED",
      headerType: "TEXT",
      headerContent: "👓 SPECS BUDDY Eye Care Reminder",
      bodyText: "Dear {{1}}, healthy vision is vital! Our optical records show your complimentary annual eye checkup is due at SPECS BUDDY {{2}}. Our certified optometrists are ready to examine your prescription with zero waiting time.\n\nWould you like to book your preferred slot this week?",
      footerText: "Certified Eye Care Experts",
      buttons: JSON.stringify([
        { type: "QUICK_REPLY", text: "Book Tomorrow" },
        { type: "QUICK_REPLY", text: "Book This Weekend" },
      ]),
      variableSample: JSON.stringify(["Priya", "Bengaluru"]),
    },
    {
      name: "specs_buddy_order_ready",
      metaTemplateId: "meta_tpl_order_8821",
      category: "UTILITY",
      language: "en_US",
      status: "APPROVED",
      headerType: "NONE",
      headerContent: null,
      bodyText: "Great news, {{1}}! 🎉 Your custom crafted eyewear order is ready for pickup at SPECS BUDDY {{2}}. Feel free to drop by anytime between 10:00 AM and 8:30 PM. Our dispensing optician will ensure your new glasses fit comfortably.\n\nThank you for choosing SPECS BUDDY!",
      footerText: "Order Fulfilment Department",
      buttons: JSON.stringify([
        { type: "URL", text: "Get Store Directions", url: "https://specsbuddy.com/stores" },
      ]),
      variableSample: JSON.stringify(["Vikram", "Delhi NCR"]),
    },
    {
      name: "specs_buddy_festive_sale",
      metaTemplateId: "meta_tpl_festive_7733",
      category: "MARKETING",
      language: "en_US",
      status: "APPROVED",
      headerType: "IMAGE",
      headerContent: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
      bodyText: "Hi {{1}}, celebrate with crystal clear vision! 🌟 Buy 1 Get 1 Free on all premium sunglasses and anti-reflective lenses this week at SPECS BUDDY {{2}}. Protect your eyes with polarized UV400 technology.\n\nLimited stock available.",
      footerText: "SPECS BUDDY Festive Specials",
      buttons: JSON.stringify([
        { type: "URL", text: "Claim BOGO Offer", url: "https://specsbuddy.com/offers" },
      ]),
      variableSample: JSON.stringify(["Sneha", "Ahmedabad"]),
    },
    {
      name: "specs_buddy_otp_verification",
      metaTemplateId: "meta_tpl_auth_1092",
      category: "AUTHENTICATION",
      language: "en_US",
      status: "APPROVED",
      headerType: "NONE",
      bodyText: "{{1}} is your SPECS BUDDY verification code. For your security, do not share this code with anyone.",
      footerText: "Security Notice",
      buttons: JSON.stringify([
        { type: "COPY_CODE", text: "Copy Code" },
      ]),
      variableSample: JSON.stringify(["482910"]),
    },
  ];

  const dbTemplates: Record<string, any> = {};
  for (const tpl of templates) {
    dbTemplates[tpl.name] = await prisma.messageTemplate.upsert({
      where: { name: tpl.name },
      update: {},
      create: tpl,
    });
  }
  console.log("✅ Seeded Meta Message Templates");

  // 5. Seed API Credentials
  await prisma.apiCredential.upsert({
    where: { id: "default-meta-credential" },
    update: {},
    create: {
      id: "default-meta-credential",
      provider: "META_WHATSAPP",
      appId: "891238471928374",
      wabaId: "109823471029384",
      phoneNumberId: "105928374829102",
      accessToken: "EAABsampleAccessTokenSpecsBuddySecretLongTerm2026",
      webhookVerifyToken: "specs_buddy_secure_verify_token_2026",
      appSecret: "9f8e7d6c5b4a3120",
      isTestMode: true,
      qualityRating: "GREEN",
      messagingLimit: "TIER_1_1K",
      status: "CONNECTED",
      lastTestedAt: new Date(),
    },
  });
  console.log("✅ Seeded API Credentials");

  // 6. Seed Past Campaign with Actual Delivery & Read Statistics
  const completedCampaign = await prisma.campaign.create({
    data: {
      name: "Diwali Optical Festival 2026",
      description: "Festive broadcast announcing complimentary eye examinations and 20% off",
      groupId: groups["VIP Customers"].id,
      templateId: dbTemplates["specs_buddy_welcome_offer"].id,
      status: "COMPLETED",
      timezone: "Asia/Kolkata",
      variableMappings: JSON.stringify({ "1": "name", "2": "city" }),
      totalRecipients: 4,
      sentCount: 4,
      deliveredCount: 4,
      readCount: 3,
      failedCount: 0,
      startedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
      completedAt: new Date(Date.now() - 3600000 * 24 * 2 + 120000),
      createdById: superAdmin.id,
    },
  });

  // Seed Campaign Recipients for completed campaign
  const vipContacts = await prisma.contact.findMany({
    where: {
      phone: { in: ["+919820011221", "+919811022334", "+919850055667"] },
    },
  });

  for (let i = 0; i < vipContacts.length; i++) {
    const c = vipContacts[i];
    const isRead = i < 2; // First 2 read it
    const fakeWamid = `wamid.HBgMOTE5ODIwMDExMjIxFQIAERgSMzAyMzQ1Nzg5MEFCQ0Q${i}F`;

    const recipient = await prisma.campaignRecipient.create({
      data: {
        campaignId: completedCampaign.id,
        contactId: c.id,
        phone: c.phone,
        customerName: c.name,
        status: isRead ? "READ" : "DELIVERED",
        metaMessageId: fakeWamid,
        sentAt: new Date(Date.now() - 3600000 * 48),
        deliveredAt: new Date(Date.now() - 3600000 * 48 + 3000),
        readAt: isRead ? new Date(Date.now() - 3600000 * 47) : null,
      },
    });

    await prisma.message.create({
      data: {
        metaMessageId: fakeWamid,
        phone: c.phone,
        direction: "OUTBOUND",
        messageType: "TEMPLATE",
        content: `Hello ${c.name}, welcome to SPECS BUDDY! 👓 Enjoy an exclusive 20% discount in ${c.city}.`,
        status: isRead ? "READ" : "DELIVERED",
        campaignRecipientId: recipient.id,
        timestamp: new Date(Date.now() - 3600000 * 48),
      },
    });
  }

  // 7. Seed Live Conversations in WhatsApp Inbox (with 24-hr service window state)
  const contactAarav = await prisma.contact.findUnique({ where: { phone: "+919820011221" } });
  if (contactAarav) {
    const convAarav = await prisma.conversation.upsert({
      where: { contactId: contactAarav.id },
      update: {},
      create: {
        contactId: contactAarav.id,
        phone: contactAarav.phone,
        contactName: contactAarav.name,
        lastMessage: "Can I collect my glasses this Saturday at Bandra?",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 35), // 35 minutes ago
        unreadCount: 1,
        assignedToId: manager.id,
        // Active 24h window (expires in ~23 hours)
        customerServiceWindowExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23),
        status: "OPEN",
      },
    });

    // Seed messages
    await prisma.conversationMessage.createMany({
      data: [
        {
          conversationId: convAarav.id,
          direction: "OUTBOUND",
          senderType: "AGENT",
          body: "Hello Aarav! Your customized progressive lenses are ready at SPECS BUDDY Bandra store.",
          status: "READ",
          sentAt: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          conversationId: convAarav.id,
          direction: "INBOUND",
          senderType: "CUSTOMER",
          body: "Can I collect my glasses this Saturday at Bandra?",
          status: "DELIVERED",
          sentAt: new Date(Date.now() - 1000 * 60 * 35),
        },
      ],
    });

    await prisma.conversationNote.create({
      data: {
        conversationId: convAarav.id,
        authorName: "Rohit Verma",
        content: "Customer confirmed pickup for Saturday afternoon. Eyewear case inspected and packed.",
      },
    });
  }

  const contactPriya = await prisma.contact.findUnique({ where: { phone: "+919845012345" } });
  if (contactPriya) {
    const convPriya = await prisma.conversation.upsert({
      where: { contactId: contactPriya.id },
      update: {},
      create: {
        contactId: contactPriya.id,
        phone: contactPriya.phone,
        contactName: contactPriya.name,
        lastMessage: "Thank you, the computer glasses are amazing! No more eye strain.",
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        unreadCount: 0,
        assignedToId: operator.id,
        // Active window (expires in ~21 hours)
        customerServiceWindowExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 21),
        status: "RESOLVED",
      },
    });

    await prisma.conversationMessage.createMany({
      data: [
        {
          conversationId: convPriya.id,
          direction: "INBOUND",
          senderType: "CUSTOMER",
          body: "Hi team, does the blue light coating come with a warranty?",
          status: "READ",
          sentAt: new Date(Date.now() - 1000 * 60 * 240),
        },
        {
          conversationId: convPriya.id,
          direction: "OUTBOUND",
          senderType: "AGENT",
          body: "Hello Priya! Yes, all SPECS BUDDY Zero-Glare blue cut lenses come with a comprehensive 1-year anti-scratch coating warranty. 🛡️",
          status: "READ",
          sentAt: new Date(Date.now() - 1000 * 60 * 200),
        },
        {
          conversationId: convPriya.id,
          direction: "INBOUND",
          senderType: "CUSTOMER",
          body: "Thank you, the computer glasses are amazing! No more eye strain.",
          status: "DELIVERED",
          sentAt: new Date(Date.now() - 1000 * 60 * 180),
        },
      ],
    });
  }

  // 8. Seed Media Files
  await prisma.mediaFile.createMany({
    data: [
      {
        fileName: "specs-buddy-banner-sunglasses.jpg",
        originalName: "sunglasses_summer_collection.jpg",
        fileType: "IMAGE",
        mimeType: "image/jpeg",
        fileSize: 245000,
        storageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
        metaMediaId: "meta_media_id_img_9918",
      },
      {
        fileName: "specs-buddy-optical-catalog-2026.pdf",
        originalName: "SPECS_BUDDY_Eyewear_Catalogue_2026.pdf",
        fileType: "DOCUMENT",
        mimeType: "application/pdf",
        fileSize: 1840000,
        storageUrl: "https://specsbuddy.com/assets/catalogue_2026.pdf",
        metaMediaId: "meta_media_id_doc_3312",
      },
      {
        fileName: "specs-buddy-store-tour.mp4",
        originalName: "specs_buddy_optical_tour.mp4",
        fileType: "VIDEO",
        mimeType: "video/mp4",
        fileSize: 8400000,
        storageUrl: "https://specsbuddy.com/assets/store_tour.mp4",
        metaMediaId: "meta_media_id_vid_4490",
      },
    ],
  });
  console.log("✅ Seeded Media Library");

  // 9. Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        userName: superAdmin.name,
        action: "SYSTEM_INITIALIZE",
        details: "SPECS BUDDY WhatsApp Marketing Suite initialized successfully.",
        ipAddress: "127.0.0.1",
      },
      {
        userId: manager.id,
        userName: manager.name,
        action: "IMPORT_CONTACTS",
        details: "Imported 10 contacts across VIP and New Customer groups.",
        ipAddress: "127.0.0.1",
      },
      {
        userId: superAdmin.id,
        userName: superAdmin.name,
        action: "LAUNCH_CAMPAIGN",
        details: "Executed campaign 'Diwali Optical Festival 2026' to VIP Customers.",
        ipAddress: "127.0.0.1",
      },
    ],
  });
  console.log("✅ Seeded Activity Logs");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
