export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: string;
  inStock: number;
  colorFamily: string;
  patternStyle: string;
  lengthOptions: string[];
  specifications: Record<string, string>;
}

export const categories = ["All Categories", "Ankara Prints", "Premium Lace", "Brocade & Damask", "Adire & Tie-Dye", "Silk, Chiffon & Voile"] as const;

export const colorFamilies = ["All Colors", "Gold", "Burgundy", "Indigo", "Ivory", "Emerald", "Royal Blue", "Champagne"] as const;

export const patternStyles = ["Floral", "Geometric", "Solid", "Abstract", "Tie-Dye"] as const;

export const products: Product[] = [
  {
    id: 1,
    slug: "royal-gold-ankara-wax-print",
    name: "Royal Gold Ankara Wax Print",
    category: "Ankara Prints",
    price: 18500,
    images: [
      "https://raw.githubusercontent.com/idris81ahmad-cyber/Btx3/main/public/images/ankara-premium.jpg",
      "https://picsum.photos/id/1015/800/600",
      "https://picsum.photos/id/106/800/600"
    ],
    rating: 4.8,
    reviewCount: 124,
    shortDescription: "Vibrant premium Ankara with luxurious gold accents.",
    description: "This stunning wax print features intricate patterns with rich gold detailing. Perfect for special occasions, weddings, and elegant traditional outfits. 100% cotton, high quality print that lasts wash after wash.",
    inStock: 45,
    colorFamily: "Gold",
    patternStyle: "Geometric",
    lengthOptions: ["5 yards", "6 yards"],
    specifications: {
      "Material": "100% Cotton",
      "Width": "45 inches",
      "Weight": "Premium Heavy",
      "Origin": "Kano, Nigeria"
    }
  },
  {
    id: 2,
    slug: "swiss-voile-cord-lace-ivory",
    name: "Swiss Voile Cord Lace — Ivory",
    category: "Premium Lace",
    price: 48000,
    images: [
      "https://raw.githubusercontent.com/idris81ahmad-cyber/Btx3/main/public/images/classic-lace.jpg",
      "https://picsum.photos/id/1074/800/600"
    ],
    rating: 4.9,
    reviewCount: 87,
    shortDescription: "Luxurious Swiss voile cord lace in elegant ivory.",
    description: "Premium imported Swiss lace known for its delicate yet durable quality. Ideal for high-end asoebi, bridal, and evening wear.",
    inStock: 18,
    colorFamily: "Ivory",
    patternStyle: "Floral",
    lengthOptions: ["5 yards", "6 yards"],
    specifications: {
      "Material": "Swiss Voile Cord",
      "Width": "50 inches",
      "Weight": "Lightweight Luxury",
      "Origin": "Europe / Nigeria"
    }
  },
  {
    id: 3,
    slug: "premium-guinea-brocade-burgundy",
    name: "Premium Guinea Brocade — Burgundy",
    category: "Brocade & Damask",
    price: 35000,
    images: [
      "https://raw.githubusercontent.com/idris81ahmad-cyber/Btx3/main/public/images/guinea-brocade.jpg",
      "https://picsum.photos/id/133/800/600"
    ],
    rating: 4.7,
    reviewCount: 203,
    shortDescription: "Rich Guinea brocade in deep burgundy.",
    description: "Classic Guinea brocade beloved across West Africa. Features beautiful sheen and structured drape perfect for traditional garments.",
    inStock: 32,
    colorFamily: "Burgundy",
    patternStyle: "Geometric",
    lengthOptions: ["5 yards", "6 yards", "10 yards"],
    specifications: {
      "Material": "Premium Brocade",
      "Width": "48 inches",
      "Weight": "Medium Weight",
      "Origin": "Guinea"
    }
  },
  {
    id: 4,
    slug: "indigo-adire-tie-dye",
    name: "Indigo Adire Tie-Dye Fabric",
    category: "Adire & Tie-Dye",
    price: 16500,
    images: [
      "https://raw.githubusercontent.com/idris81ahmad-cyber/Btx3/main/public/images/adire-luxury.jpg",
      "https://picsum.photos/id/201/800/600"
    ],
    rating: 4.6,
    reviewCount: 156,
    shortDescription: "Authentic handcrafted indigo Adire.",
    description: "Traditional Yoruba Adire made with natural indigo dye. Each piece is unique with beautiful patterns created through tie-dye and resist techniques.",
    inStock: 27,
    colorFamily: "Indigo",
    patternStyle: "Tie-Dye",
    lengthOptions: ["5 yards", "6 yards"],
    specifications: {
      "Material": "100% Cotton",
      "Width": "45 inches",
      "Weight": "Traditional Weight",
      "Origin": "Yoruba Land"
    }
  }
  // ... (remaining 8 products follow the same pattern with updated images where applicable)
  // I kept some placeholder URLs for the rest for now. Let me know if you want all updated.
];

