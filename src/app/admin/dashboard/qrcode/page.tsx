"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function QRCodePage() {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const menuUrl = siteUrl;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [menuUrl]);

  const handleDownload = useCallback(() => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const paddedCanvas = document.createElement("canvas");
    const padding = 32;
    paddedCanvas.width = canvas.width + padding * 2;
    paddedCanvas.height = canvas.height + padding * 2;
    const ctx = paddedCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    const link = document.createElement("a");
    link.download = "judytech-menu-qr.png";
    link.href = paddedCanvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <AdminLayout title="QR Code">
      <div className="max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">QR Code Generator</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Print or display this QR code so customers can scan to view the menu
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            <div
              ref={qrRef}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 inline-block"
            >
              <QRCodeCanvas
                value={menuUrl}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#1A1A1A"
                bgColor="#FFFFFF"
                imageSettings={{
                  src: "/logo.png",
                  x: undefined,
                  y: undefined,
                  height: 44,
                  width: 44,
                  excavate: true,
                }}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-brand-dark text-lg">JudyTech</p>
              <p className="text-gray-400 text-sm">امسح الرمز لعرض القائمة</p>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Public Menu URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 font-mono"
                dir="ltr"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {copied ? "✅ Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download QR Code (PNG)
          </button>

        </div>
      </div>
    </AdminLayout>
  );
}
