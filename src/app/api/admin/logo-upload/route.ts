import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";
import { readServerAdminState } from "@/lib/server-admin-db";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function extensionFromMime(mime: string) {
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  if (mime === "image/svg+xml") {
    return "svg";
  }
  return "jpg";
}

export async function POST(request: Request) {
  const state = await readServerAdminState();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;

  if (!verifyAdminSessionToken(token, state.settings.adminPin)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, message: "Invalid file type" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, message: "Invalid file size" }, { status: 400 });
  }

  const ext = extensionFromMime(file.type);
  const fileName = `logo-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads", "logos");
  const filePath = path.join(uploadsDir, fileName);

  await mkdir(uploadsDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return NextResponse.json({ ok: true, path: `/uploads/logos/${fileName}` });
}
