"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export interface ManagedImage {
  /** Temp client-only key for tracking before DB save */
  key: string;
  url: string;
  isPrimary: boolean;
}

interface MultiImageUploadProps {
  images: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${filled ? "text-yellow-400" : "text-gray-300"}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

export default function MultiImageUpload({ images, onChange }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setPrimary = (key: string) => {
    onChange(images.map((img) => ({ ...img, isPrimary: img.key === key })));
  };

  const removeImage = (key: string) => {
    const next = images.filter((img) => img.key !== key);
    // If we removed the primary, promote the first remaining
    const hasPrimary = next.some((img) => img.isPrimary);
    if (!hasPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setError("");
    const isPrimary = images.length === 0;
    onChange([
      ...images,
      { key: makeKey(), url, isPrimary },
    ]);
    setUrlInput("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploaded: ManagedImage[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          uploaded.push({ key: makeKey(), url: data.url, isPrimary: false });
        } else {
          setError(data.error ?? "Upload failed for one or more files.");
        }
      }

      if (uploaded.length > 0) {
        const combined = [...images, ...uploaded];
        // Set first image as primary if none set yet
        const hasPrimary = combined.some((img) => img.isPrimary);
        if (!hasPrimary) combined[0].isPrimary = true;
        onChange(combined);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveRight = (index: number) => {
    if (index === images.length - 1) return;
    const next = [...images];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.key}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                img.isPrimary ? "border-yellow-400 shadow-md" : "border-gray-200"
              }`}
            >
              <div className="relative h-24 bg-gray-100">
                <Image
                  src={img.url}
                  alt={`Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={img.url.startsWith("data:")}
                  onError={() => {}}
                />
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  Primary
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                {/* Set primary */}
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.key)}
                    title="Set as primary"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:bg-yellow-50 transition-colors"
                  >
                    <StarIcon filled={false} />
                  </button>
                )}
                {/* Move left */}
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveLeft(idx)}
                    title="Move left"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {/* Move right */}
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveRight(idx)}
                    title="Move right"
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeImage(img.key)}
                  title="Remove"
                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400">
          Hover over an image to reorder, set primary (⭐), or remove. The primary image is shown on the menu.
        </p>
      )}

      {/* URL input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Add image by URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all"
            dir="ltr"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlInput.trim()}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">or</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Images
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
