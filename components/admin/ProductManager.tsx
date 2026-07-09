"use client";

import { useState } from 'react';
import { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductManagerProps {
  initialProducts: Product[];
}

interface EditFormData {
  name: string;
  price: number;
  salePrice?: number;
  inStock: number;
  category: string;
}

export default function ProductManager({ initialProducts }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Open edit modal
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      inStock: product.inStock,
      category: product.category,
    });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditForm(null);
  };

  // Handle form changes
  const handleFormChange = (field: keyof EditFormData, value: string | number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  // Save edited product
  const handleSaveEdit = async () => {
    if (!editingProduct || !editForm) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update product');

      // Update local state
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id
          ? { ...p, ...editForm }
          : p
      );
      setProducts(updatedProducts);

      toast.success('Product updated successfully');
      closeEdit();
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  // Quick stock update
  const updateStock = async (id: number, newStock: number) => {
    try {
      const res = await fetch('/api/admin/products/stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, inStock: newStock }),
      });

      if (!res.ok) throw new Error('Failed to update stock');

      setProducts(products.map(p =>
        p.id === id ? { ...p, inStock: newStock } : p
      ));
      toast.success('Stock updated');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  // Seed products to DB
  const handleSeedToDb = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/admin/products/seed', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Products synced to database');
      } else {
        toast.error(data.error || 'Failed to seed products');
      }
    } catch (err) {
      toast.error('Error seeding products to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Product Management</h2>
          <p className="text-sm text-[#6B5F54] mt-1">Manage your premium textile catalog</p>
        </div>
        <button
          onClick={handleSeedToDb}
          disabled={loading}
          className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
        >
          {loading ? 'Processing...' : 'Seed / Sync to Database'}
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#D4C9B8] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F4EC] border-b border-[#D4C9B8]">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Product</th>
                <th className="text-left p-4 font-medium text-sm">Category</th>
                <th className="text-right p-4 font-medium text-sm">Price (₦)</th>
                <th className="text-center p-4 font-medium text-sm">Stock</th>
                <th className="text-right p-4 font-medium text-sm w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE6D9]">
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B5F54]">
                    No products found.
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#F8F4EC] transition-colors">
                  <td className="p-4">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-[#6B5F54] mt-0.5">{product.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-[#6B5F54]">{product.category}</td>
                  <td className="p-4 text-right font-medium">
                    {(product.salePrice || product.price).toLocaleString()}
                    {product.salePrice && (
                      <span className="text-xs text-red-500 line-through ml-1.5">
                        {product.price.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        value={product.inStock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const updated = products.map(p =>
                            p.id === product.id ? { ...p, inStock: val } : p
                          );
                          setProducts(updated);
                        }}
                        onBlur={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-[#D4C9B8] rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="px-3 py-1.5 text-xs border border-[#D4C9B8] rounded-lg hover:bg-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Edit Product</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="input-premium w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Price (₦)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => handleFormChange('price', parseInt(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Sale Price (optional)</label>
                  <input
                    type="number"
                    value={editForm.salePrice || ''}
                    onChange={(e) => handleFormChange('salePrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-premium w-full"
                    placeholder="No sale"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Stock</label>
                  <input
                    type="number"
                    value={editForm.inStock}
                    onChange={(e) => handleFormChange('inStock', parseInt(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEdit}
                className="flex-1 py-3 border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 py-3 btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
