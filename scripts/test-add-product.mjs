const base = process.argv[2] ?? "https://btx33.vercel.app";
const username = process.argv[3] ?? "halifa81";
const password = process.argv[4] ?? "halifane1";

function getCookies(headers) {
  return (headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

const csrfRes = await fetch(`${base}/api/auth/csrf`);
const { csrfToken } = await csrfRes.json();
let cookies = getCookies(csrfRes.headers);

const signInRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
  body: new URLSearchParams({
    csrfToken,
    username,
    password,
    json: "true",
    callbackUrl: `${base}/admin`,
  }),
});
cookies = [cookies, getCookies(signInRes.headers)].filter(Boolean).join("; ");

const payload = {
  name: "Test Fabric " + Date.now(),
  category: "Ankara Prints",
  price: 19999,
  shortDescription: "Test short description",
  description: "Test full description",
  inStock: 10,
  colorFamily: "Gold",
  patternStyle: "Geometric",
  lengthOptions: ["5 yards"],
  specifications: { Material: "Cotton" },
  images: ["/images/ankara-premium.jpg"],
  rating: 4.5,
  reviewCount: 0,
};

const createRes = await fetch(`${base}/api/admin/products`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookies },
  body: JSON.stringify(payload),
});

console.log("create status:", createRes.status);
console.log("body:", await createRes.text());