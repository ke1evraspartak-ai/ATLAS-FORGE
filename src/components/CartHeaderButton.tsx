"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartHeaderButton() {
  const { totalCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white hover:border-orange-500 hover:text-orange-500 transition"
      title="Корзина"
    >
      🛒

      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {totalCount}
      </span>
    </Link>
  );
}