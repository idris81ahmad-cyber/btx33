"use client";

import { useState } from 'react';
import { Product } from '@/types/product';

interface ProductManagerProps {
  initialProducts: Product[];
}

/**
 * Reusable Admin Product Manager Component
 * Can be used in app/admin/page.tsx for better product management UI
 */
export default function ProductManager({ initialProducts }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedToDb = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/products/seed', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
        // Optionally refresh products list here
      } else {
        setMessage(data.error || 'Failed to seed products');
      }
    } catch (err) {
      setMessage('Error seeding products to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Product Management</h2>
        <button
          onClick={handleSeedToDb}
          disabled={loading}
          className="btn-primary px-6 py-2 text-sm"
        >
          {loading ? 'Seeding...' : 'Seed / Sync to Database'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F1EDE4] text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price (₦)</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-[#F8F4EC]">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-sm text-[#6B5F54]">{product.category}</td>
                <td className="p-3">{(product.salePrice || product.price).toLocaleString()}</td>
                <td className="p-3">{product.inStock}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="text-sm px-3 py-1 border rounded hover:bg-white">
                    Edit
                  </button>
                  <button className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#6B5F54]">
        Note: Full edit/delete functionality can be expanded. Seed button syncs legacy products into Drizzle DB.
      </p>
    </div>
  );
}
