"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import BannerForm from "@/components/admin/BannerForm";
import { db } from "@/lib/instant/client";
import { id } from "@instantdb/react";
import type { Banner } from "@/types";

interface BannerFormData {
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  image: string;
  link: string;
  order: number;
  active: boolean;
}

export default function BannersPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({ banners: {} });

  const banners: Banner[] = useMemo(
    () =>
      ((data?.banners ?? []) as Banner[])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [data]
  );

  const handleAdd = async (formData: BannerFormData) => {
    const newId = id();
    await db.transact(
      db.tx.banners[newId].update({
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        subtitle_en: formData.subtitle_en,
        subtitle_ar: formData.subtitle_ar,
        image: formData.image,
        link: formData.link,
        sort_order: formData.order,
        active: formData.active,
      })
    );
    setShowAdd(false);
  };

  const handleEdit = async (formData: BannerFormData) => {
    if (!editBanner) return;
    await db.transact(
      db.tx.banners[editBanner.id].update({
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        subtitle_en: formData.subtitle_en,
        subtitle_ar: formData.subtitle_ar,
        image: formData.image,
        link: formData.link,
        sort_order: formData.order,
        active: formData.active,
      })
    );
    setEditBanner(null);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm("Delete this banner?")) return;
    setDeletingId(bannerId);
    try {
      await db.transact(db.tx.banners[bannerId].delete());
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    await db.transact(db.tx.banners[banner.id].update({ active: !banner.active }));
  };

  return (
    <AdminLayout title="Banners">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Hero Banners</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {banners.length} banner{banners.length !== 1 ? "s" : ""} — shown as a carousel at the top of the menu
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Banner
          </button>
        </div>

        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-0.5">How it works</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Active banners appear as a full-width carousel on the public menu.
              You can control the auto-slide speed in <span className="font-semibold">Settings → Carousel Interval</span>.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-52 skeleton" />)}
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center text-gray-400 border border-gray-100">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="font-semibold text-gray-500 mb-1">No banners yet</p>
            <p className="text-sm text-gray-400">Add your first banner to replace the default hero section.</p>
            <button onClick={() => setShowAdd(true)} className="mt-5 bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              Add Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map((banner) => (
              <BannerCard key={banner.id} banner={banner} deletingId={deletingId} onEdit={() => setEditBanner(banner)} onDelete={() => handleDelete(banner.id)} onToggle={() => handleToggleActive(banner)} />
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Banner" size="lg">
        <BannerForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editBanner} onClose={() => setEditBanner(null)} title={`Edit Banner — ${editBanner?.title_en || "(no title)"}`} size="lg">
        {editBanner && (
          <BannerForm initialData={editBanner} onSubmit={handleEdit} onCancel={() => setEditBanner(null)} isEdit />
        )}
      </Modal>
    </AdminLayout>
  );
}

function BannerCard({ banner, deletingId, onEdit, onDelete, onToggle }: { banner: Banner; deletingId: string | null; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200">
        {banner.image ? (
          <Image src={banner.image} alt={banner.title_en || "Banner"} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl">🖼️</div>
        )}
        <button onClick={onToggle} className={`absolute top-2 end-2 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors shadow-sm ${banner.active ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-400 text-white hover:bg-gray-500"}`}>
          {banner.active ? "Active" : "Inactive"}
        </button>
        <div className="absolute top-2 start-2 bg-black/50 text-white text-xs font-mono px-2 py-0.5 rounded-full">
          #{banner.sort_order ?? banner.order}
        </div>
      </div>
      <div className="p-4">
        <div className="min-h-[40px]">
          {banner.title_en ? (
            <p className="font-semibold text-gray-800 text-sm truncate">{banner.title_en}</p>
          ) : (
            <p className="text-gray-400 text-sm italic">No title</p>
          )}
          {banner.title_ar && <p className="text-gray-500 text-xs truncate mt-0.5" dir="rtl">{banner.title_ar}</p>}
        </div>
        {banner.subtitle_en && <p className="text-gray-400 text-xs truncate mt-1">{banner.subtitle_en}</p>}
        {banner.link && <p className="text-blue-400 text-xs truncate mt-1"><span className="text-gray-400">Link: </span>{banner.link}</p>}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button onClick={onDelete} disabled={deletingId === banner.id} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40">
            {deletingId === banner.id ? (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
