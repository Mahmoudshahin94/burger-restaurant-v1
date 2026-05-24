"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import ImageUpload from "./ImageUpload";
import type { Category } from "@/types";

interface FormData {
  name_en: string;
  name_ar: string;
  icon: string;
  image: string;
  order: number;
  active: boolean;
}

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit,
}: CategoryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name_en: initialData?.name_en ?? "",
      name_ar: initialData?.name_ar ?? "",
      icon: initialData?.icon ?? "",
      image: initialData?.image ?? "",
      order: initialData?.order ?? 1,
      active: initialData?.active ?? true,
    },
  });

  const validate = async (data: FormData) => {
    setSubmitError(null);
    try {
      await onSubmit({ ...data, order: Number(data.order) });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

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

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all";

  return (
    <form onSubmit={handleSubmit(validate)} className="space-y-4">
      <Field label="Name (English)" error={errors.name_en?.message}>
        <input
          {...register("name_en", { required: "English name is required" })}
          placeholder="e.g. Hot Drinks"
          className={inputClass}
          dir="ltr"
        />
      </Field>

      <Field label="Name (Arabic)" error={errors.name_ar?.message}>
        <input
          {...register("name_ar", { required: "Arabic name is required" })}
          placeholder="مثال: مشروبات ساخنة"
          className={inputClass}
          dir="rtl"
        />
      </Field>

      {/* Category Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Image
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Upload an image to represent this category. If no image is provided, the icon/emoji will be used.
        </p>
        <Controller
          name="image"
          control={control}
          render={({ field }) => (
            <ImageUpload value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Icon (emoji fallback)" error={errors.icon?.message}>
          <input
            {...register("icon")}
            placeholder="☕"
            className={`${inputClass} text-center text-xl`}
          />
          <p className="text-xs text-gray-500 mt-1">Used if no image is set</p>
        </Field>

        <Field label="Display Order" error={errors.order?.message}>
          <input
            {...register("order", { valueAsNumber: true })}
            type="number"
            min={0}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <input
          {...register("active")}
          type="checkbox"
          id="active"
          className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Active (visible in menu)
        </label>
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
          {isSubmitting ? "Saving..." : isEdit ? "Update Category" : "Add Category"}
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
