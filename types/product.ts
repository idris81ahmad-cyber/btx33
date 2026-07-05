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
  // Optional fields for extended data
  material?: string;
  width?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedLength: string;
  currentPrice: number;
}
