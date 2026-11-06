import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const optInStatus = searchParams.get("optInStatus");

    const where: any = {};
    if (groupId) {
      where.groupMembers = { some: { groupId } };
    }
    if (optInStatus) {
      where.optInStatus = optInStatus;
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        groupMembers: { include: { group: { select: { name: true } } } },
      },
    });

    const exportRows = contacts.map((c) => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone,
      Email: c.email || "",
      City: c.city || "",
      Tags: c.tags,
      OptInStatus: c.optInStatus,
      ConsentSource: c.consentSource || "",
      ConsentDate: c.consentDate ? c.consentDate.toISOString().split("T")[0] : "",
      Groups: c.groupMembers.map((g) => g.group.name).join("; "),
      CreatedAt: c.createdAt.toISOString().split("T")[0],
    }));

    const csv = Papa.unparse(exportRows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="specs_buddy_contacts_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to export contacts" }, { status: 500 });
  }
}
