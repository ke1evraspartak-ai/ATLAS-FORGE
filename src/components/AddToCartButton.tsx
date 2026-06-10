"use client";

import { useCart } from "@/components/CartProvider";

export default function AddToCartButton({ product }: { product: any }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        addItem({
          id: product.id,
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          image: product.images?.[0] || "",
          price: product.price || "",
          price_usd: product.price_usd || "",
          usd_rate: product.usd_rate || "",
          price_eur: product.price_eur || "",
          eur_rate: product.eur_rate || "",
        });
      }}
      className="w-11 h-11 rounded-xl border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition flex items-center justify-center shrink-0"
      title="Добавить в корзину"
    >
      🛒
    </button>
  );
}