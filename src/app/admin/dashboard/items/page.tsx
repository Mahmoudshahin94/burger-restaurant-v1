"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import ItemForm from "@/components/admin/ItemForm";
import { db } from "@/lib/db";
import type { MenuItem, Category, ItemImage } from "@/types";
import type { ManagedImage } from "@/components/admin/MultiImageUpload";

export default function ItemsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = db.useQuery({
    categories: {},
    items: {},
    item_images: {},
  });

  const categories: Category[] = useMemo(() => data?.categories ?? [], [data?.categories]);
  const allItems: MenuItem[] = useMemo(() => data?.items ?? [], [data?.items]);
  const allItemImages: ItemImage[] = useMemo(() => data?.item_images ?? [], [data?.item_images]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (filterCategory) {
      items = items.filter((i) => i.category_id === filterCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name_en.toLowerCase().includes(q) ||
          i.name_ar.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => {
      const catA = categories.find((c) => c.id === a.category_id);
      const catB = categories.find((c) => c.id === b.category_id);
      const catOrderA = catA?.order ?? 999;
      const catOrderB = catB?.order ?? 999;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [allItems, filterCategory, search, categories]);

  /**
   * Syncs item_images in InstantDB for a given item:
   * - Deletes rows that are no longer in the managed list
   * - Creates or updates rows based on the managed list
   */
  const syncItemImages = async (itemId: string, managedImages: ManagedImage[]) => {
    const existing = allItemImages.filter((img) => img.item_id === itemId);
    const txns = [];

    // Delete images that were removed
    for (const ex of existing) {
      const stillPresent = managedImages.some((m) => m.key === ex.id);
      if (!stillPresent) {
        txns.push(db.tx.item_images[ex.id].delete());
      }
    }

    // Upsert remaining / new images
    for (let i = 0; i < managedImages.length; i++) {
      const m = managedImages[i];
      const rowId = m.key === "legacy" || !existing.some((e) => e.id === m.key) ? id() : m.key;
      txns.push(
        db.tx.item_images[rowId].update({
          item_id: itemId,
          image: m.url,
          is_primary: m.isPrimary,
          order: i,
        })
      );
    }

    if (txns.length > 0) {
      await db.transact(txns);
    }
  };

  const handleAdd = async (
    formData: {
      name_en: string;
      name_ar: string;
      description_en?: string;
      description_ar?: string;
      price_small: number;
      price_large: number;
      available: boolean;
      order: number;
      category_id?: string;
    },
    images: ManagedImage[]
  ) => {
    const newId = id();
    const primaryImage = images.find((m) => m.isPrimary)?.url ?? images[0]?.url ?? "";

    await db.transact([
      db.tx.items[newId].update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        description_en: formData.description_en ?? "",
        description_ar: formData.description_ar ?? "",
        price_small: formData.price_small,
        price_large: formData.price_large,
        image: primaryImage,
        available: formData.available,
        order: formData.order,
        category_id: formData.category_id ?? "",
      }),
    ]);

    // Save item_images separately (need the newId)
    const imgTxns = images.map((m, i) =>
      db.tx.item_images[id()].update({
        item_id: newId,
        image: m.url,
        is_primary: m.isPrimary,
        order: i,
      })
    );
    if (imgTxns.length > 0) await db.transact(imgTxns);

    setShowAdd(false);
  };

  const handleEdit = async (
    formData: {
      name_en: string;
      name_ar: string;
      description_en?: string;
      description_ar?: string;
      price_small: number;
      price_large: number;
      available: boolean;
      order: number;
      category_id?: string;
    },
    images: ManagedImage[]
  ) => {
    if (!editItem) return;
    const primaryImage = images.find((m) => m.isPrimary)?.url ?? images[0]?.url ?? "";

    await db.transact([
      db.tx.items[editItem.id].update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        description_en: formData.description_en ?? "",
        description_ar: formData.description_ar ?? "",
        price_small: formData.price_small,
        price_large: formData.price_large,
        image: primaryImage,
        available: formData.available,
        order: formData.order,
        category_id: formData.category_id ?? "",
      }),
    ]);

    await syncItemImages(editItem.id, images);
    setEditItem(null);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return;
    setDeletingId(itemId);

    const imgTxns = allItemImages
      .filter((img) => img.item_id === itemId)
      .map((img) => db.tx.item_images[img.id].delete());

    await db.transact([
      ...imgTxns,
      db.tx.items[itemId].delete(),
    ]);
    setDeletingId(null);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await db.transact([
      db.tx.items[item.id].update({ available: !item.available }),
    ]);
  };

  const getItemThumbnail = (item: MenuItem): string | null => {
    const imgs = allItemImages.filter((img) => img.item_id === item.id);
    if (imgs.length > 0) {
      const primary = imgs.find((img) => img.is_primary) ?? imgs[0];
      return primary.image || null;
    }
    return item.image || null;
  };

  return (
    <AdminLayout title="Menu Items">
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Menu Items</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {allItems.length} items total
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="text-lg">+</span> Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all flex-1"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all sm:w-56"
          >
            <option value="">All Categories</option>
            {categories
              .sort((a, b) => a.order - b.order)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name_en}
                </option>
              ))}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-16 skeleton" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">
            <div className="text-4xl mb-3">🍽️</div>
            <p>No items found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Item
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Price S / L
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Photos
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const thumb = getItemThumbnail(item);
                    const imgCount = allItemImages.filter((img) => img.item_id === item.id).length;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {thumb ? (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={thumb}
                                  alt={item.name_en}
                                  fill
                                  className="object-cover"
                                  onError={() => {}}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-brand-cream flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">☕</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{item.name_en}</p>
                              <p className="text-gray-500 text-xs" dir="rtl">{item.name_ar}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const cat = categories.find((c) => c.id === item.category_id);
                            return cat ? (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {cat.icon} {cat.name_en}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {item.price_small > 0 && (
                              <span className="text-gray-600">{item.price_small}</span>
                            )}
                            {item.price_small > 0 && item.price_large > 0 && (
                              <span className="text-gray-400 mx-1">/</span>
                            )}
                            {item.price_large > 0 && (
                              <span className="font-medium text-gray-800">{item.price_large}</span>
                            )}
                            {!item.price_small && !item.price_large && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">
                            {imgCount > 0 ? (
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                {imgCount} photo{imgCount !== 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                              item.available
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {item.available ? "Available" : "Out of Stock"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditItem(item)}
                              className="text-gray-400 hover:text-brand-red p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Menu Item" size="lg">
        <ItemForm
          categories={categories}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Menu Item" size="lg">
        {editItem && (
          <ItemForm
            initialData={editItem}
            initialImages={allItemImages.filter((img) => img.item_id === editItem.id)}
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
