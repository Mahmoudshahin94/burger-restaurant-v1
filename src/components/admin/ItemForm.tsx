"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { MenuItem, Category, ItemImage } from "@/types";
import MultiImageUpload, { type ManagedImage } from "./MultiImageUpload";

interface FormData {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_small: number;
  price_large: number;
  available: boolean;
  order: number;
  category_id: string;
}

interface ItemFormProps {
  initialData?: Partial<MenuItem>;
  initialImages?: ItemImage[];
  categories: Category[];
  onSubmit: (data: FormData, images: ManagedImage[]) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function ItemForm({
  initialData,
  initialImages,
  categories,
  onSubmit,
  onCancel,
  isEdit,
}: ItemFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [images, setImages] = useState<ManagedImage[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return initialImages
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return (a.order ?? 0) - (b.order ?? 0);
        })
        .map((img) => ({
          key: img.id,
          url: img.image,
          isPrimary: img.is_primary ?? false,
        }));
    }
    // Migrate legacy single image if present
    if (initialData?.image) {
      return [{ key: "legacy", url: initialData.image, isPrimary: true }];
    }
    return [];
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name_en: initialData?.name_en ?? "",
      name_ar: initialData?.name_ar ?? "",
      description_en: initialData?.description_en ?? "",
      description_ar: initialData?.description_ar ?? "",
      price_small: initialData?.price_small ?? 0,
      price_large: initialData?.price_large ?? 0,
      available: initialData?.available ?? true,
      order: initialData?.order ?? 1,
      category_id: initialData?.category_id ?? "",
    },
  });

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

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await onSubmit(
        {
          ...data,
          price_small: Number(data.price_small),
          price_large: Number(data.price_large),
          order: Number(data.order),
        },
        images
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name (English)" error={errors.name_en?.message}>
          <input
            {...register("name_en", { required: "English name is required" })}
            placeholder="e.g. Espresso"
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="Name (Arabic)" error={errors.name_ar?.message}>
          <input
            {...register("name_ar", { required: "Arabic name is required" })}
            placeholder="إسبرسو"
            className={inputClass}
            dir="rtl"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Description (English)">
          <textarea
            {...register("description_en")}
            placeholder="Optional description"
            rows={2}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="Description (Arabic)">
          <textarea
            {...register("description_ar")}
            placeholder="وصف اختياري"
            rows={2}
            className={inputClass}
            dir="rtl"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Price Small (0 = N/A)" error={errors.price_small?.message}>
          <input
            {...register("price_small", { valueAsNumber: true })}
            type="number"
            min={0}
            step={0.5}
            className={inputClass}
          />
        </Field>
        <Field label="Price Large" error={errors.price_large?.message}>
          <input
            {...register("price_large", { valueAsNumber: true })}
            type="number"
            min={0}
            step={0.5}
            className={inputClass}
          />
        </Field>
        <Field label="Display Order">
          <input
            {...register("order", { valueAsNumber: true })}
            type="number"
            min={0}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Category">
        <select {...register("category_id")} className={inputClass}>
          <option value="">— No category —</option>
          {categories
            .sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0))
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name_en} / {cat.name_ar}
              </option>
            ))}
        </select>
      </Field>

      <Field label="Images">
        <MultiImageUpload images={images} onChange={setImages} />
      </Field>

      <div className="flex items-center gap-3">
        <input
          {...register("available")}
          type="checkbox"
          id="available"
          className="w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
        />
        <label htmlFor="available" className="text-sm font-medium text-gray-700">
          Available (in stock)
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
          {isSubmitting ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
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
