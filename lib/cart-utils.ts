import type { CartItem, Product } from "@/types/product";

/** Strip cart-specific fields so a cart line item can be saved to the wishlist. */
export function cartItemToProduct(item: CartItem): Product {
  const { quantity, selectedLength, currentPrice, ...product } = item;
  return product;
}