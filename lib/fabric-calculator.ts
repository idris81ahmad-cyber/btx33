export interface GarmentPreset {
  id: string;
  name: string;
  description: string;
  yards: number;
  category: string;
}

export const garmentPresets: GarmentPreset[] = [
  { id: "wrapper", name: "Wrapper & Blouse", description: "Standard iro and buba set", yards: 5, category: "Ankara Prints" },
  { id: "agbada", name: "Agbada (3-piece)", description: "Full agbada with inner and trousers", yards: 10, category: "Brocade & Damask" },
  { id: "kaftan", name: "Kaftan / Jalabiya", description: "Men's flowing kaftan", yards: 4, category: "Shadda & Atiku" },
  { id: "asoebi", name: "Asoebi Guest", description: "Guest outfit for owambe", yards: 6, category: "Ankara Prints" },
  { id: "bridal", name: "Bridal Lace Gown", description: "Full bridal with train allowance", yards: 8, category: "Premium Lace" },
  { id: "gele", name: "Gele (Headtie)", description: "Structured gele wrap", yards: 2, category: "Premium Lace" },
  { id: "shirt", name: "Senator Shirt", description: "Men's fitted senator", yards: 3, category: "Plain & Solid Premium Cottons" },
  { id: "skirt", name: "Pencil Skirt + Top", description: "Office or casual two-piece", yards: 4, category: "Silk, Chiffon & Voile" },
];

export function calculateTotalYards(selected: string[], customYards = 0): number {
  const presetTotal = garmentPresets
    .filter((p) => selected.includes(p.id))
    .reduce((sum, p) => sum + p.yards, 0);
  return presetTotal + customYards;
}