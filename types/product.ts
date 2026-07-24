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
  /** Optional legacy / display fields */
  material?: string;
  width?: string;
  weight?: string;
  /** Sheer / opaque — critical for lace & chiffon */
  opacity?: string;
  /** Wash & iron guidance */
  careInstructions?: string;
  /**
   * Occasion tags: asoebi, bridal, everyday, agbada, kaftan, office, gele, evening, senator, wrapper
   */
  bestUses?: string[];
  /** Short origin / artisan story */
  originStory?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedLength: string;
  currentPrice: number;
}
