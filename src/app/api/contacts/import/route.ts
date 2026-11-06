import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

function normalizePhone(phone: string): string {
  const digits = String(phone).replace(/[^0-9]/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.length > 10 && !phone.startsWith("+")) return "+" + digits;
  if (phone.startsWith("+")) return "+" + digits;
  return "+" + digits;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = await request.json();

    const { records, groupId, consentSource, duplicateHandling = "SKIP" } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No contact records provided" }, { status: 400 });
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; phone?: string; error: string }> = [];

    // Pre-fetch target group or 'All Customers'
    let targetGroup = null;
    if (groupId) {
      targetGroup = await prisma.contactGroup.findUnique({ where: { id: groupId } });
    }
    if (!targetGroup) {
      targetGroup = await prisma.contactGroup.findUnique({ where: { name: "All Customers" } });
    }

    for (let index = 0; index < records.length; index++) {
      const row = records[index];
      const rawName = row.name || row.Name || row["Customer Name"] || row["Full Name"] || "";
      const rawPhone = row.phone || row.Phone || row["Phone Number"] || row.Mobile || row.mobile || "";
      const email = row.email || row.Email || null;
      const city = row.city || row.City || null;
      const tags = row.tags || row.Tags || "";

      if (!rawName || !rawPhone) {
        errorCount++;
        errors.push({ row: index + 1, error: "Missing required Name or Phone Number" });
        continue;
      }

      const phone = normalizePhone(String(rawPhone));
      if (phone.length < 10) {
        errorCount++;
        errors.push({ row: index + 1, phone: rawPhone, error: "Invalid phone number length" });
        continue;
      }

      const existing = await prisma.contact.findUnique({ where: { phone } });

      if (existing) {
        duplicateCount++;
        if (duplicateHandling === "UPDATE") {
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name: rawName.trim(),
              email: email ? String(email).trim() : existing.email,
              city: city ? String(city).trim() : existing.city,
              tags: tags ? `${existing.tags},${tags}` : existing.tags,
            },
          });
          if (targetGroup) {
            await prisma.contactGroupMember.upsert({
              where: { contactId_groupId: { contactId: existing.id, groupId: targetGroup.id } },
              update: {},
              create: { contactId: existing.id, groupId: targetGroup.id },
            });
          }
        }
        continue;
      }

      try {
        const newContact = await prisma.contact.create({
          data: {
            name: rawName.trim(),
            phone,
            email: email ? String(email).trim() : null,
            city: city ? String(city).trim() : null,
            tags: tags ? String(tags).trim() : "csv_import",
            optInStatus: "OPTED_IN",
            consentSource: consentSource || "CSV_IMPORT",
            consentDate: new Date(),
          },
        });

        await prisma.consentRecord.create({
          data: {
            contactId: newContact.id,
            source: consentSource || "CSV_IMPORT",
            proofDetails: `Bulk import on ${new Date().toISOString()} by ${user?.name || "Admin"}`,
          },
        });

        if (targetGroup) {
          await prisma.contactGroupMember.create({
            data: { contactId: newContact.id, groupId: targetGroup.id },
          });
        }

        importedCount++;
      } catch (err: any) {
        errorCount++;
        errors.push({ row: index + 1, phone, error: err.message || "Failed to insert record" });
      }
    }

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "IMPORT_CONTACTS",
      details: `Bulk imported ${importedCount} contacts, skipped ${duplicateCount} duplicates, ${errorCount} errors`,
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: records.length,
        importedCount,
        duplicateCount,
        errorCount,
        errors: errors.slice(0, 20), // return top 20 errors
      },
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}
