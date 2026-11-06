import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { getAuthUserFromRequest, logActivity } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "application/pdf": "DOCUMENT",
  "video/mp4": "VIDEO",
};

const MAX_SIZES: Record<string, number> = {
  IMAGE: 5 * 1024 * 1024,      // 5 MB
  DOCUMENT: 100 * 1024 * 1024, // 100 MB
  VIDEO: 16 * 1024 * 1024,     // 16 MB
};

export async function GET() {
  try {
    const media = await prisma.mediaFile.findMany({
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json({ media });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const fileType = ALLOWED_TYPES[mimeType];

    if (!fileType) {
      return NextResponse.json(
        { error: `Unsupported file format '${mimeType}'. Allowed: JPEG, PNG, WEBP, PDF, MP4` },
        { status: 400 }
      );
    }

    const maxSize = MAX_SIZES[fileType] || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit (${(maxSize / (1024 * 1024)).toFixed(0)}MB for ${fileType})` },
        { status: 400 }
      );
    }

    // Save to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    const storageUrl = `/uploads/${safeName}`;

    const mediaRecord = await prisma.mediaFile.create({
      data: {
        fileName: safeName,
        originalName: file.name,
        fileType,
        mimeType,
        fileSize: file.size,
        storageUrl,
        metaMediaId: `meta_media_${Date.now()}`,
      },
    });

    await logActivity({
      userId: user?.id,
      userName: user?.name,
      action: "UPLOAD_MEDIA",
      details: `Uploaded ${fileType} file '${file.name}' (${(file.size / 1024).toFixed(1)} KB)`,
    });

    return NextResponse.json({ success: true, media: mediaRecord });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Media ID required" }, { status: 400 });

    const media = await prisma.mediaFile.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    // Remove local file if exists
    try {
      const filePath = path.join(process.cwd(), "public", "uploads", media.fileName);
      await fs.unlink(filePath);
    } catch (e) {}

    await prisma.mediaFile.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Media deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
