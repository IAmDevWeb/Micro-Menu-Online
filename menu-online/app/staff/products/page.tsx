"use client";

import { useEffect, useState } from "react";
import { formatBaht } from "@/lib/format";

type Category = { id: string; name: string; sortOrder: number };
type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  active: boolean;
};

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]);
    setCategories(cRes.categories || []);
    setProducts(pRes.products || []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
        ]);
        if (!active) return;
        setCategories(cRes.categories || []);
        setProducts(pRes.products || []);
        setLoading(false);
      } catch {
        if (active) setError("โหลดไม่สำเร็จ");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("ลบเมนูนี้?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">จัดการเมนูอาหาร</h1>
          <p className="text-sm text-neutral-500">เพิ่ม/แก้ไข/ซ่อนเมนู</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-neutral-900 text-white px-4 py-2 font-semibold text-sm"
        >
          + เพิ่มเมนู
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      {showForm && (
        <ProductForm
          categories={categories}
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-neutral-400">กำลังโหลด...</p>
      ) : (
        categories.map((c) => {
          const items = products.filter((p) => p.categoryId === c.id);
          return (
            <div key={c.id} className="bg-white rounded-2xl border overflow-hidden">
              <div className="bg-neutral-100 px-4 py-2 font-semibold text-sm">{c.name}</div>
              <div className="divide-y">
                {items.map((p) => (
                  <div key={p.id} className={`flex items-center justify-between px-4 py-3 gap-3 ${!p.active ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-lg object-cover shrink-0 bg-neutral-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-neutral-500 truncate">{p.description || "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-emerald-700">{formatBaht(p.price)}</span>
                      <button
                        onClick={() => {
                          setEditing(p);
                          setShowForm(true);
                        }}
                        className="text-sm text-neutral-600 underline"
                      >
                        แก้ไข
                      </button>
                      <button onClick={() => toggleActive(p)} className="text-sm text-neutral-600 underline">
                        {p.active ? "ซ่อน" : "แสดง"}
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-sm text-red-600 underline">
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-sm text-neutral-400 px-4 py-3">ไม่มีเมนู</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProductForm({
  categories,
  product,
  onClose,
  onSaved,
}: {
  categories: Category[];
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || "");
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const preview = file ? URL.createObjectURL(file) : imageUrl;

  async function uploadImage(f: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
    return data.url;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const finalImageUrl = file ? await uploadImage(file) : imageUrl;
      const base = {
        categoryId,
        name,
        description,
        price: parseFloat(price),
        imageUrl: finalImageUrl,
      };
      const res = product
        ? await fetch(`/api/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(base),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(base),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-3 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{product ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h2>
        {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อเมนู" className="w-full border rounded-lg px-3 py-2" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบาย" className="w-full border rounded-lg px-3 py-2" />
        <input required type="number" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ราคา (บาท)" className="w-full border rounded-lg px-3 py-2" />

        <div className="space-y-2">
          <label className="block text-sm text-neutral-600">รูปภาพเมนู</label>
          {preview && (
            <img src={preview} alt="ตัวอย่าง" className="h-28 w-28 rounded-xl object-cover border" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {(file || imageUrl) && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setImageUrl(null);
              }}
              className="text-sm text-red-600 underline"
            >
              ลบรูปภาพ
            </button>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm">ยกเลิก</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-neutral-900 text-white py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? "..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}
