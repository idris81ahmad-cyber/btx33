import { execSync } from "child_process";

const token = process.env.GITHUB_TOKEN || execSync("gh auth token", { encoding: "utf-8" }).trim();
const repo = "idris81ahmad-cyber/btx33";
const path = "data/products.json";
const branch = "master";

const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  },
});

console.log("meta status:", metaRes.status);
const meta = await metaRes.json();
if (!meta.sha) {
  console.log(meta);
  process.exit(1);
}

const contentRes = await fetch(meta.download_url || `https://raw.githubusercontent.com/${repo}/${branch}/${path}`);
const products = await contentRes.json();
const content = Buffer.from(JSON.stringify(products, null, 2)).toString("base64");

const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "test: verify github storage write access",
    content,
    sha: meta.sha,
    branch,
  }),
});

console.log("put status:", putRes.status);
console.log(await putRes.text());