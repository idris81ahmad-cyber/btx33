const LAGOS_STATES = new Set(["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"]);
const NORTHERN_STATES = new Set([
  "Kano", "Kaduna", "Katsina", "Jigawa", "Bauchi", "Gombe", "Borno", "Yobe",
  "Adamawa", "Taraba", "Plateau", "Niger", "Kebbi", "Sokoto", "Zamfara",
]);
const ABUJA_STATES = new Set(["FCT - Abuja"]);

export interface ShippingEstimate {
  fee: number;
  label: string;
  eta: string;
}

export function estimateShipping(state: string, subtotal: number): ShippingEstimate {
  if (subtotal >= 75_000) {
    return { fee: 0, label: "Free shipping", eta: "2–5 business days" };
  }

  if (ABUJA_STATES.has(state)) {
    return { fee: 2_500, label: "Abuja metro", eta: "1–3 business days" };
  }
  if (LAGOS_STATES.has(state)) {
    return { fee: 3_000, label: "Southwest", eta: "2–4 business days" };
  }
  if (NORTHERN_STATES.has(state)) {
    return { fee: 2_000, label: "Northern Nigeria", eta: "2–4 business days" };
  }
  return { fee: 4_500, label: "Nationwide", eta: "3–6 business days" };
}