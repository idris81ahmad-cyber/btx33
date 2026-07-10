"use client";

import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductManagerProps {
  initialProducts: Product[];
  onCreateNew?: () => void;
}

interface EditFormData {
  name: string;
  price: number;
  salePrice?: number;
  inStock: number;
  category: string;
}

interface CreateFormData extends EditFormData {}

// Stock status filter options
type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const stockStatusOptions: { value: StockStatus; label: string }[] = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock (> 0)' },
  { value: 'low_stock', label: 'Low Stock (1-10)' },
  { value: 'out_of_stock', label: 'Out of Stock (0)' },
];

export default function ProductManager({ initialProducts, onCreateNew }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search, category, and stock status filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');

  // Sync with parent when initialProducts change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Derived unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['All Categories', ...cats.sort()];
  }, [products]);

  // Filtered products based on search, category, and stock status
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter (name, slug, category)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Stock status filter
    if (stockStatus !== 'all') {
      if (stockStatus === 'in_stock') {
        result = result.filter(p => p.inStock > 0);
      } else if (stockStatus === 'low_stock') {
        result = result.filter(p => p.inStock > 0 && p.inStock <= 10);
      } else if (stockStatus === 'out_of_stock') {
        result = result.filter(p => p.inStock === 0);
      }
    }

    return result;
  }, [products, searchTerm, selectedCategory, stockStatus]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setStockStatus('all');
  };

  // Helper to get stock status label and color for visual polish
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out', color: 'text-red-600 bg-red-50 border-red-200' };
    if (stock <= 10) return { label: 'Low', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Good', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

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

  // Create New Product - delegate to parent rich modal if available, else use built-in simple modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '',
    price: 15000,
    inStock: 20,
    category: 'Ankara Prints',
  });

  const openCreate = () => {
    if (onCreateNew) {
      onCreateNew(); // Delegate to parent's rich modal
      return;
    }
    // Fallback to built-in simple create modal
    setCreateForm({
      name: '',
      price: 15000,
      inStock: 20,
      category: 'Ankara Prints',
      salePrice: undefined,
    });
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    setShowCreateModal(false);
  };

  const handleCreateFormChange = (field: keyof CreateFormData, value: string | number) => {
    setCreateForm({ ...createForm, [field]: value });
  };

  // Create new product
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...createForm,
        slug: createForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        shortDescription: createForm.name, // fallback
        description: '',
        images: [],
        rating: 4.5,
        reviewCount: 0,
        colorFamily: 'Mixed',
        patternStyle: 'Various',
        lengthOptions: ['5 yards', '6 yards'],
        specifications: {},
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create product');
      }

      const newProduct = await res.json();
      setProducts([...products, newProduct]);

      toast.success('New product created successfully');
      closeCreate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Product Management</h2>
          <p className="text-sm text-[#6B5F54] mt-1">Manage your premium textile catalog</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search and Filter Controls - Enhanced with Stock Status */}
          <div className="flex items-center gap-2 bg-white border border-[#D4C9B8] rounded-xl px-3 py-1.5 flex-wrap">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-40 text-sm border-0 focus:ring-0 px-2 py-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-premium text-sm border-0 focus:ring-0 px-2 py-1 bg-transparent"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as StockStatus)}
              className="input-premium text-sm border-0 focus:ring-0 px-2 py-1 bg-transparent"
              title="Filter by stock status"
            >
              {stockStatusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {(searchTerm || selectedCategory !== 'All Categories' || stockStatus !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-xs px-2 py-0.5 text-[#6B5F54] hover:text-red-600 transition-colors"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={openCreate}
            className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            + Create New Product
          </button>
          <button
            onClick={handleSeedToDb}
            disabled={loading}
            className="px-5 py-2.5 text-sm border border-[#D4C9B8] rounded-xl hover:bg-white/50 transition-colors flex items-center gap-2"
          >
            {loading ? 'Processing...' : 'Seed / Sync to Database'}
          </button>
        </div>
      </div>

      {/* Results count */}
      {(searchTerm || selectedCategory !== 'All Categories' || stockStatus !== 'all') && (
        <div className="text-sm text-[#6B5F54]">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      )}

      {/* Products Table with Visual Stock Polish */}
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#6B5F54]">
                    {products.length === 0 
                      ? 'No products found. Click "Create New Product" to get started.'
                      : 'No products match your search/filter criteria.'
                    }
                  </td>
                </tr>
              )}
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product.inStock);
                return (
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
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${stockInfo.color}`}>
                          {product.inStock} {stockInfo.label}
                        </span>
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
                          className="w-14 text-center border border-[#D4C9B8] rounded px-1.5 py-0.5 text-sm"
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
                );
              })}
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

      {/* Create New Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Create New Product</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#6B5F54] block mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  className="input-premium w-full"
                  placeholder="e.g. Royal Gold Ankara"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Price (₦) *</label>
                  <input
                    type="number"
                    value={createForm.price}
                    onChange={(e) => handleCreateFormChange('price', parseInt(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Sale Price (optional)</label>
                  <input
                    type="number"
                    value={createForm.salePrice || ''}
                    onChange={(e) => handleCreateFormChange('salePrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-premium w-full"
                    placeholder="No sale"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Initial Stock</label>
                  <input
                    type="number"
                    value={createForm.inStock}
                    onChange={(e) => handleCreateFormChange('inStock', parseInt(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#6B5F54] block mb-1.5">Category</label>
                  <input
                    type="text"
                    value={createForm.category}
                    onChange={(e) => handleCreateFormChange('category', e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeCreate}
                className="flex-1 py-3 border border-[#D4C9B8] rounded-xl hover:bg-[#F8F4EC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 py-3 btn-primary"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>

            <p className="text-xs text-[#6B5F54] mt-4 text-center">
              For advanced options (images, specs, lengths), use the full "Add Fabric" form in the header.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
