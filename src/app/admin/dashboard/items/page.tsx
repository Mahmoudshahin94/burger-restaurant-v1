"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import ItemForm from "@/components/admin/ItemForm";
import { db } from "@/lib/instant/client";
import { id } from "@instantdb/react";
import type { TransactionChunk } from "@instantdb/react";
import type { AppSchema } from "../../../../../instant.schema";
import type { MenuItem, Category, ItemImage } from "@/types";
import type { ManagedImage } from "@/components/admin/MultiImageUpload";

// Builds the productImages tx chunks needed to reconcile `existing` rows with the
// images currently managed in the form (handles add/update/delete + re-ordering).
function buildImageChunks(productId: string, managedImages: ManagedImage[], existing: ItemImage[]) {
  const chunks: TransactionChunk<AppSchema, "productImages">[] = [];

  for (const ex of existing) {
    const stillPresent = managedImages.some((m) => m.key === ex.id);
    if (!stillPresent) {
      chunks.push(db.tx.productImages[ex.id].delete());
    }
  }

  managedImages.forEach((m, i) => {
    const existingRow = existing.find((e) => e.id === m.key);
    if (existingRow) {
      chunks.push(db.tx.productImages[existingRow.id].update({ image_url: m.url, is_primary: m.isPrimary, sort_order: i }));
    } else {
      const newImgId = id();
      chunks.push(
        db.tx.productImages[newImgId]
          .update({ image_url: m.url, is_primary: m.isPrimary, sort_order: i })
          .link({ product: productId })
      );
    }
  });

  return chunks;
}

export default function ItemsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = db.useQuery({
    categories: {},
    products: { images: {}, category: {} },
  });

  const categories: Category[] = useMemo(
    () =>
      ((data?.categories ?? []) as Category[])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [data]
  );

  const allItems: MenuItem[] = useMemo(
    () =>
      (data?.products ?? []).map((p) => ({
        id: p.id,
        name_en: p.name_en,
        name_ar: p.name_ar,
        description_en: p.description_en ?? null,
        description_ar: p.description_ar ?? null,
        price_small: p.price_small ?? null,
        price_large: p.price_large ?? null,
        image: p.image ?? null,
        available: p.available,
        sort_order: p.sort_order ?? null,
        order: p.sort_order ?? 0,
        category_id: p.category?.id ?? "",
      })),
    [data]
  );

  const allItemImages: ItemImage[] = useMemo(
    () =>
      (data?.products ?? []).flatMap((p) =>
        (p.images ?? []).map((img) => ({
          id: img.id,
          product_id: p.id,
          item_id: p.id,
          image: img.image_url,
          image_url: img.image_url,
          is_primary: img.is_primary,
          order: img.sort_order,
          sort_order: img.sort_order,
        }))
      ),
    [data]
  );

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (filterCategory) items = items.filter((i) => i.category_id === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name_en.toLowerCase().includes(q) || i.name_ar.toLowerCase().includes(q));
    }
    return items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [allItems, filterCategory, search]);

  const handleAdd = async (formData: { name_en: string; name_ar: string; description_en?: string; description_ar?: string; price_small: number; price_large: number; available: boolean; order: number; category_id?: string }, images: ManagedImage[]) => {
    const primaryImage = images.find((m) => m.isPrimary)?.url ?? images[0]?.url ?? "";
    const productId = id();

    const chunks: (TransactionChunk<AppSchema, "products"> | TransactionChunk<AppSchema, "productImages">)[] = [
      db.tx.products[productId].update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        description_en: formData.description_en ?? "",
        description_ar: formData.description_ar ?? "",
        price_small: formData.price_small,
        price_large: formData.price_large,
        image: primaryImage,
        available: formData.available,
        sort_order: formData.order,
        created_at: new Date().toISOString(),
      }),
    ];

    if (formData.category_id) {
      chunks.push(db.tx.products[productId].link({ category: formData.category_id }));
    }

    chunks.push(...buildImageChunks(productId, images, []));

    await db.transact(chunks);
    setShowAdd(false);
  };

  const handleEdit = async (formData: { name_en: string; name_ar: string; description_en?: string; description_ar?: string; price_small: number; price_large: number; available: boolean; order: number; category_id?: string }, images: ManagedImage[]) => {
    if (!editItem) return;
    const primaryImage = images.find((m) => m.isPrimary)?.url ?? images[0]?.url ?? editItem.image ?? "";

    const chunks: (TransactionChunk<AppSchema, "products"> | TransactionChunk<AppSchema, "productImages">)[] = [
      db.tx.products[editItem.id].update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        description_en: formData.description_en ?? "",
        description_ar: formData.description_ar ?? "",
        price_small: formData.price_small,
        price_large: formData.price_large,
        image: primaryImage,
        available: formData.available,
        sort_order: formData.order,
        updated_at: new Date().toISOString(),
      }),
    ];

    if (formData.category_id) {
      chunks.push(db.tx.products[editItem.id].link({ category: formData.category_id }));
    } else if (editItem.category_id) {
      chunks.push(db.tx.products[editItem.id].unlink({ category: editItem.category_id }));
    }

    const existingImages = getItemImages(editItem.id);
    chunks.push(...buildImageChunks(editItem.id, images, existingImages));

    await db.transact(chunks);
    setEditItem(null);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(itemId);
    try {
      // productImages are linked with onDelete: "cascade", so they're removed automatically.
      await db.transact(db.tx.products[itemId].delete());
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await db.transact(db.tx.products[item.id].update({ available: !item.available }));
  };

  const getItemThumbnail = (item: MenuItem): string | null => {
    const imgs = allItemImages.filter((img) => img.item_id === item.id || img.product_id === item.id);
    if (imgs.length > 0) {
      const primary = imgs.find((img) => img.is_primary) ?? imgs[0];
      return primary.image || null;
    }
    return item.image || null;
  };

  const getItemImages = (itemId: string): ItemImage[] =>
    allItemImages.filter((img) => img.item_id === itemId || img.product_id === itemId);

  return (
    <AdminLayout title="Products">
      <div className="max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">{allItems.length} items total</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 self-start sm:self-auto">
            <span className="text-lg">+</span> Add Product
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all flex-1" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all sm:w-56">
            <option value="">All Categories</option>
            {categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name_en}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl h-16 skeleton" />)}</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            <div className="text-4xl mb-3">🍽️</div>
            <p>No products found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-20">Image</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Price</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-28">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const thumb = getItemThumbnail(item);
                    const cat = categories.find((c) => c.id === item.category_id);
                    const hasSmall = (item.price_small ?? 0) > 0;
                    const hasLarge = (item.price_large ?? 0) > 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {thumb ? (
                              <Image src={thumb} alt={item.name_en} fill className="object-cover" sizes="48px" unoptimized={thumb.startsWith("data:")} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">☕</div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-800 text-sm">{item.name_en}</p>
                          <p className="text-gray-400 text-xs" dir="rtl">{item.name_ar}</p>
                        </td>
                        <td className="px-5 py-3">
                          {cat ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                              {cat.icon && <span>{cat.icon}</span>}
                              {cat.name_en}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {hasSmall && <div className="text-xs text-gray-500">S: <span className="font-semibold text-gray-800">{item.price_small} ₪</span></div>}
                          {hasLarge && <div className="text-xs text-gray-500">L: <span className="font-semibold text-gray-800">{item.price_large} ₪</span></div>}
                          {!hasSmall && !hasLarge && <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${item.available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditItem({ ...item, order: item.sort_order ?? item.order ?? 0 });
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                            >
                              {deletingId === item.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        <ItemForm categories={categories} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit — ${editItem?.name_en ?? ""}`}>
        {editItem && (
          <ItemForm
            initialData={{ ...editItem, order: editItem.sort_order ?? editItem.order ?? 0 }}
            initialImages={getItemImages(editItem.id)}
            categories={categories}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
            isEdit
          />
        )}
      </Modal>
    </AdminLayout>
  );
}
