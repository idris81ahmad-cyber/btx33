import fs from "fs";
import path from "path";
import { list, put } from "@vercel/blob";
import { Product } from "@/types/product";
import {
  readProductsFromGitHub,
  hasGitHubStorage,
  writeProductsToGitHub,
} from "@/lib/products-github";
import { hasDatabase } from "@/lib/db";
import {
  getProductsFromDb,
  seedProductsToDb,
  upsertProductInDb,
  deleteProductFromDb,
  updateStockInDb,
} from "@/lib/db/products";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const BLOB_PATHNAME = "btx3/products.json";

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function canWriteToFilesystem(): boolean {
  if (process.env.VERCEL) return false;
  try {
    ensureDir();
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultProducts(): Product[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./products");
    return mod.products || mod.default || [];
  } catch {
    return [];
  }
}

function readProductsFromFilesystem(): Product[] | null {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read products.json from filesystem", e);
  }
  return null;
}

async function readProductsFromBlob(): Promise<Product[] | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME) ?? blobs[0];
    if (!blob) return null;

    const res = await fetch(blob.downloadUrl, { cache: "no-store" });
    if (!res.ok) return null;

    const parsed = await res.json();
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    console.error("Failed to read products from blob", e);
    return null;
  }
}

async function writeProductsToBlob(products: Product[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(products, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

function writeProductsToFilesystem(products: Product[]): void {
  ensureDir();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

async function getProductsLegacy(): Promise<Product[]> {
  if (hasBlobStorage()) {
    const fromBlob = await readProductsFromBlob();
    if (fromBlob) return fromBlob;
  }

  if (hasGitHubStorage() || process.env.VERCEL) {
    const fromGitHub = await readProductsFromGitHub();
    if (fromGitHub) return fromGitHub;
  }

  const fromFs = readProductsFromFilesystem();
  if (fromFs) {
    if (hasBlobStorage()) {
      try {
        await writeProductsToBlob(fromFs);
      } catch (e) {
        console.error("Failed to seed blob store from filesystem", e);
      }
    }
    return fromFs;
  }

  const defaults = getDefaultProducts();
  if (defaults.length > 0) {
    await saveProducts(defaults);
  }
  return defaults;
}

export async function getProducts(): Promise<Product[]> {
  if (hasDatabase()) {
    const fromDb = await getProductsFromDb();
    if (fromDb && fromDb.length > 0) return fromDb;
    const legacy = await getProductsLegacy();
    await seedProductsToDb(legacy);
    const seeded = await getProductsFromDb();
    if (seeded && seeded.length > 0) return seeded;
  }
  return getProductsLegacy();
}

export async function saveProducts(products: Product[]): Promise<void> {
  if (hasBlobStorage()) {
    await writeProductsToBlob(products);
    return;
  }

  if (hasGitHubStorage()) {
    await writeProductsToGitHub(products);
    return;
  }

  if (canWriteToFilesystem()) {
    writeProductsToFilesystem(products);
    return;
  }

  throw new Error(
    "Product storage is read-only on Vercel. Add BLOB_READ_WRITE_TOKEN (Vercel Blob) or GITHUB_TOKEN (repo write) in your Vercel project environment variables."
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function addProduct(
  product: Omit<Product, "id"> & { id?: number }
): Promise<Product> {
  const all = await getProducts();
  const newId = product.id || Math.max(0, ...all.map((p) => p.id)) + 1;
  const newProduct: Product = {
    ...product,
    id: newId,
  } as Product;
  all.push(newProduct);
  await saveProducts(all);
  return newProduct;
}

export async function updateProduct(
  id: number,
  updates: Partial<Product>
): Promise<Product | null> {
  const all = await getProducts();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...all[index], ...updates } as Product;
  if (hasDatabase()) {
    const dbResult = await upsertProductInDb(updated);
    if (dbResult) return dbResult;
  }
  all[index] = updated;
  await saveProducts(all);
  return updated;
}

export async function updateProductStock(id: number, inStock: number): Promise<boolean> {
  if (hasDatabase()) {
    const ok = await updateStockInDb(id, inStock);
    if (ok) return true;
  }
  const result = await updateProduct(id, { inStock });
  return result !== null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  if (hasDatabase()) {
    const ok = await deleteProductFromDb(id);
    if (ok) return true;
  }
  const all = await getProducts();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) return false;
  await saveProducts(filtered);
  return true;
}

export async function resetToDefaults(): Promise<Product[]> {
  const defaults = getDefaultProducts();
  await saveProducts(defaults);
  return defaults;
}