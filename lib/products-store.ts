import fs from 'fs';
import path from 'path';
import { Product } from '@/types/product';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultProducts(): Product[] {
  // Fallback to the static list if JSON not present or empty
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./products');
    return mod.products || mod.default || [];
  } catch {
    return [];
  }
}

export function getProducts(): Product[] {
  ensureDir();
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read products.json, falling back', e);
  }
  const defaults = getDefaultProducts();
  if (defaults.length > 0) {
    saveProducts(defaults);
  }
  return defaults;
}

export function saveProducts(products: Product[]) {
  ensureDir();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function addProduct(product: Omit<Product, 'id'> & { id?: number }): Product {
  const all = getProducts();
  const newId = product.id || Math.max(0, ...all.map((p) => p.id)) + 1;
  const newProduct: Product = {
    ...product,
    id: newId,
  } as Product;
  all.push(newProduct);
  saveProducts(all);
  return newProduct;
}

export function updateProduct(id: number, updates: Partial<Product>): Product | null {
  const all = getProducts();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...all[index], ...updates } as Product;
  all[index] = updated;
  saveProducts(all);
  return updated;
}

export function deleteProduct(id: number): boolean {
  const all = getProducts();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) return false;
  saveProducts(filtered);
  return true;
}

export function resetToDefaults() {
  const defaults = getDefaultProducts();
  saveProducts(defaults);
  return defaults;
}
