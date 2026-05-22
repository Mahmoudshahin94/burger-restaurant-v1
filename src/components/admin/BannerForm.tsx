"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import ImageUpload from "./ImageUpload";
import type { Banner } from "@/types";

interface BannerFormData {
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  link: string;
  order: number;
  active: boolean;
}

interface BannerFormProps {
  initialData?: Partial<Banner>;
  onSubmit: (data: BannerFormData & { image: string }) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function BannerForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit,
}: BannerFormProps) {
  const [image, setImage] = useState(initialData?.image ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormData>({
    defaultValues: {
      title_en: initialData?.title_en ?? "",
      title_ar: initialData?.title_ar ?? "",
      subtitle_en: initialData?.subtitle_en ?? "",
      subtitle_ar: initialData?.subtitle_ar ?? "",
      link: initialData?.link ?? "",
      order: initialData?.order ?? 1,
      active: initialData?.active ?? true,
    },
  });

  const validate = async (data: BannerFormData) => {
    setSubmitError(null);
    try {
      await onSubmit({ ...data, order: Number(data.order), image });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all";

  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(validate)} className="space-y-4">
      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
        <ImageUpload value={image} onChange={setImage} />
        <p className="text-xs text-gray-400 mt-1">
          Recommended: wide landscape image (1200×500px or similar)
        </p>
      </div>

      <hr className="border-gray-100" />

      {/* Titles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title (English)" error={errors.title_en?.message}>
          <input
            {...register("title_en")}
            placeholder="e.g. 🔥 Summer Specials"
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="Title (Arabic)" error={errors.title_ar?.message}>
          <input
            {...register("title_ar")}
            placeholder="مثال: 🔥 عروض الصيف"
            className={inputClass}
            dir="rtl"
          />
        </Field>
      </div>

      {/* Subtitles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subtitle (English)" error={errors.subtitle_en?.message}>
          <input
            {...register("subtitle_en")}
            placeholder="e.g. Limited time offer"
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="Subtitle (Arabic)" error={errors.subtitle_ar?.message}>
          <input
            {...register("subtitle_ar")}
            placeholder="مثال: عرض لفترة محدودة"
            className={inputClass}
            dir="rtl"
          />
        </Field>
      </div>

      {/* Link */}
      <Field label="CTA Link (optional)" error={errors.link?.message}>
        <input
          {...register("link")}
          type="url"
          placeholder="https://wa.me/... or leave empty"
          className={inputClass}
          dir="ltr"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        {/* Order */}
        <Field label="Display Order" error={errors.order?.message}>
          <input
            {...register("order", { valueAsNumber: true })}
            type="number"
            min={0}
            className={inputClass}
          />
        </Field>

        {/* Active */}
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              {...register("active")}
              type="checkbox"
              id="banner-active"
              className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
            />
            <span className="text-sm font-medium text-gray-700">Active (show in carousel)</span>
          </label>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSubmitting ? "Saving..." : isEdit ? "Update Banner" : "Add Banner"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
