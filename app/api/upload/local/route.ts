import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image", "video", "file"]);

const sanitizeFolder = (value: FormDataEntryValue | null) => {
  const folder = typeof value === "string" ? value : "uploads";
  return folder.replace(/[^a-zA-Z0-9_-]/g, "") || "uploads";
};

const getExtension = (file: File) => {
  const extension = path.extname(file.name).toLowerCase();
  if (extension) return extension;

  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "video/mp4") return ".mp4";
  return ".jpg";
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    if (type === "file") {
      const isSupported =
        file.type.startsWith("image/") || file.type === "application/pdf";

      if (!isSupported) {
        return NextResponse.json(
          { error: "Only image or PDF files are allowed" },
          { status: 400 },
        );
      }
    }

    if (type === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (type === "video" && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }

    const maxSize = type === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File is too large" }, { status: 400 });
    }

    const folder = sanitizeFolder(formData.get("folder"));
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}${getExtension(file)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);

    return NextResponse.json({
      filePath: `/uploads/${folder}/${filename}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
