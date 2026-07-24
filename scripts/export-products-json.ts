import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { products } from "../lib/products";

const out = resolve(process.cwd(), "data/products.json");
writeFileSync(out, JSON.stringify(products, null, 2) + "\n");
console.log(`Wrote ${products.length} products to data/products.json`);
