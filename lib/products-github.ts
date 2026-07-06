import { Product } from "@/types/product";

const REPO = "idris81ahmad-cyber/biyora-shop";
const FILE_PATH = "data/products.json";
const BRANCH = "master";

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function hasGitHubStorage(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export async function readProductsFromGitHub(): Promise<Product[] | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: githubHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FILE_PATH}`,
        { cache: "no-store" }
      );
      if (!raw.ok) return null;
      const parsed = await raw.json();
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    }

    const data = await res.json();
    if (!data.content) return null;
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    console.error("Failed to read products from GitHub", e);
    return null;
  }
}

export async function writeProductsToGitHub(products: Product[]): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is required for product storage on Vercel. Add a repo-scoped token in Vercel environment variables."
    );
  }

  const metaRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: githubHeaders(), cache: "no-store" }
  );

  if (!metaRes.ok) {
    throw new Error(`Failed to read products file metadata from GitHub (${metaRes.status})`);
  }

  const meta = await metaRes.json();
  const content = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");

  const putRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "chore(admin): update products catalog",
      content,
      sha: meta.sha,
      branch: BRANCH,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`Failed to write products to GitHub: ${err}`);
  }
}