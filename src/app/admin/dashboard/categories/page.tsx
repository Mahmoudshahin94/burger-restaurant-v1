"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import CategoryForm from "@/components/admin/CategoryForm";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(
      (data ?? []).map((c) => ({ ...c, order: c.sort_order ?? 0 })) as Category[]
    );
    setIsLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (formData: { name_en: string; name_ar: string; icon?: string; image?: string; order: number; active: boolean }) => {
    await supabase.from("categories").insert({
      name_en: formData.name_en,
      name_ar: formData.name_ar,
      icon: formData.icon ?? "",
      image: formData.image ?? null,
      sort_order: formData.order,
      active: formData.active,
    });
    await fetchCategories();
    setShowAdd(false);
  };

  const handleEdit = async (formData: { name_en: string; name_ar: string; icon?: string; image?: string; order: number; active: boolean }) => {
    if (!editCategory) return;
    await supabase.from("categories").update({
      name_en: formData.name_en,
      name_ar: formData.name_ar,
      icon: formData.icon ?? "",
      image: formData.image ?? null,
      sort_order: formData.order,
      active: formData.active,
    }).eq("id", editCategory.id);
    await fetchCategories();
    setEditCategory(null);
  };

  const handleDelete = async (catId: string) => {
    if (!confirm("Delete this category? Items in this category will lose their category assignment.")) return;
    setDeletingId(catId);
    await supabase.from("categories").delete().eq("id", catId);
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setDeletingId(null);
  };

  const handleToggleActive = async (cat: Category) => {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, active: !cat.active } : c));
  };

  return (
    <AdminLayout title="Categories">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Menu Categories</h2>
            <p className="text-sm text-gray-500 mt-0.5">{categories.length} categories total</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl h-16 skeleton" />)}</div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            <div className="text-4xl mb-3">📂</div>
            <p>No categories yet. Add your first category!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-14">#</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Arabic Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-28">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4 text-gray-400 text-sm font-mono">{cat.sort_order ?? cat.order}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={cat.image}
                                alt={cat.name_en}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized={cat.image.startsWith("http")}
                              />
                            </div>
                          ) : cat.icon ? (
                            <span className="text-2xl leading-none w-10 h-10 flex items-center justify-center">{cat.icon}</span>
                          ) : (
                            <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">📁</span>
                          )}
                          <div>
                            <span className="font-semibold text-gray-800 text-sm">{cat.name_en}</span>
                            {cat.image && cat.icon && (
                              <span className="block text-xs text-gray-400">Fallback: {cat.icon}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-sm" dir="rtl">{cat.name_ar}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${cat.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditCategory(cat)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(cat.id)} disabled={deletingId === cat.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40">
                            {deletingId === cat.id ? (
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Category">
        <CategoryForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title={`Edit — ${editCategory?.name_en ?? ""}`}>
        {editCategory && (
          <CategoryForm initialData={{ ...editCategory, order: editCategory.sort_order ?? editCategory.order ?? 0 }} onSubmit={handleEdit} onCancel={() => setEditCategory(null)} isEdit />
        )}
      </Modal>
    </AdminLayout>
  );
}
