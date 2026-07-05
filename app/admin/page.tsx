"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { categories } from "@/lib/products";

interface ProductForm {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  shortDescription: string;
  description: string;
  inStock: number;
  colorFamily: string;
  patternStyle: string;
  lengthOptions: string[];
  specifications: Record<string, string>;
  images: string[];
  rating: number;
  reviewCount: number;
}

const emptyForm: ProductForm = {
  name: "",
  category: "Ankara Prints",
  price: 15000,
  shortDescription: "",
  description: "",
  inStock: 20,
  colorFamily: "Gold",
  patternStyle: "Geometric",
  lengthOptions: ["5 yards", "6 yards"],
  specifications: { "Material": "100% Cotton", "Origin": "Nigeria" },
  images: [],
  rating: 4.7,
  reviewCount: 50,
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Protect the admin route
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Show loading while checking auth
  if (status === "loading" || !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[#6B5F54]">Checking access...</div>
      </div>
    );
  }

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setNewImageUrl("");
    setNewSpecKey("");
    setNewSpecValue("");
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      salePrice: product.salePrice,
      shortDescription: product.shortDescription,
      description: product.description,
      inStock: product.inStock,
      colorFamily: product.colorFamily,
      patternStyle: product.patternStyle,
      lengthOptions: [...product.lengthOptions],
      specifications: { ...product.specifications },
      images: [...product.images],
      rating: product.rating,
      reviewCount: product.reviewCount,
    });
    setNewImageUrl("");
    setNewSpecKey("");
    setNewSpecValue("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // Image handling
  const addImage = (url: string) => {
    if (!url.trim()) return;
    if (form.images.includes(url.trim())) {
      toast.info("Image already added");
      return;
    }
    setForm({ ...form, images: [...form.images, url.trim()] });
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const uploadImageFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      addImage(data.url);
      toast.success("Image uploaded");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    }
  };

  // Drag and drop for images (URLs or files)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const text = e.dataTransfer.getData("text");

    if (text && text.startsWith("http")) {
      addImage(text);
      return;
    }

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        void uploadImageFile(file);
      }
    });
  };

  // Specs
  const addSpecification = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;
    setForm({
      ...form,
      specifications: {
        ...form.specifications,
        [newSpecKey.trim()]: newSpecValue.trim(),
      },
    });
    setNewSpecKey("");
    setNewSpecValue("");
  };

  const removeSpec = (key: string) => {
    const copy = { ...form.specifications };
    delete copy[key];
    setForm({ ...form, specifications: copy });
  };

  // Length options
  const addLength = (len: string) => {
    if (!len.trim() || form.lengthOptions.includes(len.trim())) return;
    setForm({ ...form, lengthOptions: [...form.lengthOptions, len.trim()] });
  };

  const removeLength = (len: string) => {
    setForm({ ...form, lengthOptions: form.lengthOptions.filter((l) => l !== len) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortDescription) {
      toast.error("Name and short description are required");
      return;
    }
    if (form.images.length === 0) {
      toast.error("Add at least one image");
      return;
    }

    setSaving(true);

    const payload: any = {
      ...form,
      slug: editingProduct?.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()) || "Failed to save product");
      }

      toast.success(editingProduct ? "Product updated" : "Product created");
      closeModal();
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Product deleted");
      await loadProducts();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all products to defaults?")) return;
    try {
      const res = await fetch("/api/admin/products/reset", { method: "POST" });
      if (res.ok) {
        toast.success("Reset to default products");
      }
      await loadProducts();
    } catch {
      toast.error("Reset failed");
    }
  };

  // Simple stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.inStock, 0);
  const avgRating = totalProducts > 0
    ? (products.reduce((s, p) => s + p.rating, 0) / totalProducts).toFixed(1)
    : "0";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="uppercase tracking-[3px] text-xs text-[#C5A46E] mb-1">BTX3 ADMIN</div>
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Product Management</h1>
          <p className="text-[#6B5F54] mt-1">Full CRUD • Image management • Live updates to shop</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="px-4 py-2 text-sm border border-[#D4C9B8] rounded-xl hover:bg-white/50 transition">
            View Live Site
          </Link>
          <button onClick={openAdd} className="btn-primary px-5 py-2 text-sm rounded-xl">
            + Add Fabric
          </button>
          <button onClick={handleReset} className="px-4 py-2 text-sm border border-[#D4C9B8] rounded-xl hover:bg-white/50">
            Reset Defaults
          </button>
          <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="px-5 py-2 text-sm bg-[#6B2D3C] text-white rounded-xl hover:bg-[#5a2532]">
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6">
          <div className="text-sm text-[#6B5F54]">Total Fabrics</div>
          <div className="text-4xl font-semibold mt-1 tracking-tight">{totalProducts}</div>
        </div>
        <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6">
          <div className="text-sm text-[#6B5F54]">Units in Stock</div>
          <div className="text-4xl font-semibold mt-1 tracking-tight">{totalStock}</div>
        </div>
        <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6">
          <div className="text-sm text-[#6B5F54]">Avg Rating</div>
          <div className="text-4xl font-semibold mt-1 tracking-tight">{avgRating}</div>
        </div>
        <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6">
          <div className="text-sm text-[#6B5F54]">Categories</div>
          <div className="text-4xl font-semibold mt-1 tracking-tight">6</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#D4C9B8] rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-xl tracking-tight">All Fabrics ({products.length})</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#6B5F54]">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F4EC] text-[#6B5F54]">
                <tr>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-right px-6 py-3">Price</th>
                  <th className="text-right px-6 py-3">Stock</th>
                  <th className="text-center px-6 py-3 w-56">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6D9]">
                {products.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-[#6B5F54]">No products yet. Add your first fabric.</td></tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F4EC]/60">
                    <td className="px-6 py-4">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-[#6B5F54] truncate max-w-[280px]">{p.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-[#6B5F54]">{p.category}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      ₦{p.price.toLocaleString()}
                      {p.salePrice && <span className="ml-2 text-xs line-through text-[#6B5F54]">₦{p.salePrice}</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={p.inStock > 15 ? "text-emerald-600" : "text-amber-600"}>{p.inStock}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs px-4 py-1.5 rounded-xl border border-[#D4C9B8] hover:bg-white">Edit</button>
                        <button onClick={() => handleDelete(p)} className="text-xs px-4 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-[#6B5F54]">
        Changes made here are saved to <code>data/products.json</code> and reflected on the shop immediately (in dev).
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">{editingProduct ? "Edit Fabric" : "Add New Fabric"}</h3>
                <p className="text-sm text-[#6B5F54]">All fields update the live shop</p>
              </div>
              <button onClick={closeModal} className="text-2xl leading-none text-[#6B5F54]">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-premium w-full rounded-2xl px-4 py-3" required />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-premium w-full rounded-2xl px-4 py-3">
                    {categories.filter(c => c !== "All Categories").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Price (₦) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="input-premium w-full rounded-2xl px-4 py-3" required />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Sale Price (optional)</label>
                  <input type="number" value={form.salePrice || ""} onChange={e => setForm({ ...form, salePrice: e.target.value ? parseInt(e.target.value) : undefined })} className="input-premium w-full rounded-2xl px-4 py-3" />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Short Description *</label>
                <input value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} className="input-premium w-full rounded-2xl px-4 py-3" required />
              </div>

              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Full Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="input-premium w-full rounded-3xl px-4 py-3 resize-y" />
              </div>

              {/* Images */}
              <div>
                <label className="text-sm text-[#6B5F54] block mb-2">Images (add URLs or drop files)</label>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center mb-3 transition ${dragActive ? "border-[#6B2D3C] bg-[#F8F4EC]" : "border-[#D4C9B8]"}`}
                >
                  <p className="text-sm text-[#6B5F54]">Drag &amp; drop image files here or paste image URL below</p>
                  <p className="text-[10px] text-[#6B5F54] mt-1">Files become data URLs (demo). Use Vercel Blob in production.</p>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://... or paste image URL"
                    className="input-premium flex-1 rounded-2xl px-4 py-3 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(newImageUrl); } }}
                  />
                  <button type="button" onClick={() => addImage(newImageUrl)} className="px-5 rounded-2xl border border-[#D4C9B8] text-sm">Add URL</button>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="group relative border rounded-2xl overflow-hidden aspect-video bg-[#F8F4EC]">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-2 py-0.5 rounded">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Length Options */}
              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Available Lengths</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.lengthOptions.map((len) => (
                    <span key={len} className="inline-flex items-center gap-1 bg-[#F8F4EC] px-3 py-1 rounded-full text-sm">
                      {len}
                      <button type="button" onClick={() => removeLength(len)} className="text-[#6B5F54] hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {["5 yards", "6 yards", "10 yards"].map(l => (
                    <button type="button" key={l} onClick={() => addLength(l)} className="text-xs px-3 py-1 border rounded-full hover:bg-[#F8F4EC]">+ {l}</button>
                  ))}
                  <input placeholder="Custom length" className="input-premium text-sm flex-1 rounded-2xl px-3 py-1" onKeyDown={(e) => {
                    if (e.key === "Enter") { addLength((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }
                  }} />
                </div>
              </div>

              {/* Specs */}
              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Specifications</label>
                <div className="space-y-1 mb-2 text-sm">
                  {Object.entries(form.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between border rounded-xl px-3 py-1.5 bg-[#F8F4EC]">
                      <span><strong>{k}:</strong> {v}</span>
                      <button type="button" onClick={() => removeSpec(k)} className="text-red-500">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newSpecKey} onChange={e => setNewSpecKey(e.target.value)} placeholder="Key e.g. Width" className="input-premium flex-1 rounded-2xl px-3 py-2 text-sm" />
                  <input value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} placeholder="Value" className="input-premium flex-1 rounded-2xl px-3 py-2 text-sm" />
                  <button type="button" onClick={addSpecification} className="px-4 rounded-2xl border">Add</button>
                </div>
              </div>

              {/* Stock + Rating */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">In Stock</label>
                  <input type="number" value={form.inStock} onChange={e => setForm({ ...form, inStock: parseInt(e.target.value) || 0 })} className="input-premium w-full rounded-2xl px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Rating</label>
                  <input type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })} className="input-premium w-full rounded-2xl px-4 py-3" />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Review Count</label>
                  <input type="number" value={form.reviewCount} onChange={e => setForm({ ...form, reviewCount: parseInt(e.target.value) })} className="input-premium w-full rounded-2xl px-4 py-3" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-6 py-3 rounded-2xl border">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary px-8 py-3 rounded-2xl disabled:opacity-70">
                  {saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Fabric"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
