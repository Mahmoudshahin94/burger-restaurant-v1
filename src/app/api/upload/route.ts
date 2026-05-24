import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData as unknown as { get(key: string): File | null }).get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash("sha256")
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message ?? "Upload failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
