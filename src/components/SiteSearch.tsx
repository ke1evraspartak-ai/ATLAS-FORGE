"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const cleanNumber = (value: string) => {
  return Number(String(value || "").replace(/\D/g, ""));
};

const formatRub = (value: number) => {
  if (!value) return "";
  return `${value.toLocaleString("ru-RU")} ₽`;
};

const getFinalRubPrice = (product: any) => {
  const usd = cleanNumber(product.price_usd);
  const usdRate = cleanNumber(product.usd_rate);

  if (usd && usdRate) return formatRub(usd * usdRate);

  const eur = cleanNumber(product.price_eur);
  const eurRate = cleanNumber(product.eur_rate);

  if (eur && eurRate) return formatRub(eur * eurRate);

  const rub = cleanNumber(product.price);

  if (rub) return formatRub(rub);

  return "Цена по запросу";
};

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!normalizedQuery) {
        setProducts([]);
        return;
      }

      setLoading(true);

      const safeQuery = normalizedQuery.replace(/[%_,]/g, "");

      const { data } = await supabase
        .from("products")
        .select("*")
        .or(
          `name.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%,section.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`
        )
        .limit(8);

      setProducts(data || []);
      setLoading(false);
    };

    const timer = setTimeout(searchProducts, 200);
    return () => clearTimeout(timer);
  }, [normalizedQuery]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white hover:border-orange-500 hover:text-orange-500 transition"
        title="Поиск"
      >
        🔍
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />

          <div className="relative max-w-5xl mx-auto px-6 pt-24">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-5 border-b border-zinc-800">
                <form action="/search" className="flex-1">
                  <input
                    autoFocus
                    name="q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск товара, артикула или раздела..."
                    className="w-full bg-black border border-zinc-700 rounded-xl px-5 py-4 text-white placeholder:text-zinc-500 outline-none focus:border-orange-500"
                  />
                </form>

                <button
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-12 h-12 rounded-xl border border-zinc-700 text-white hover:border-red-500 hover:text-red-500 transition"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[520px] overflow-auto">
                {!normalizedQuery && (
                  <div className="p-6 text-zinc-500">
                    Начните вводить название товара или артикул.
                  </div>
                )}

                {normalizedQuery && loading && (
                  <div className="p-6 text-zinc-500">
                    Ищем...
                  </div>
                )}

                {normalizedQuery && !loading && products.length === 0 && (
                  <div className="p-6 text-zinc-500">
                    Ничего не найдено
                  </div>
                )}

                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalog/${product.slug || product.id}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex gap-5 p-5 hover:bg-white/5 transition border-b border-zinc-900 last:border-b-0"
                  >
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                          Нет фото
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-white font-bold text-lg line-clamp-2">
                        {product.name}
                      </div>

                      <div className="text-zinc-500 text-sm mt-1">
                        {product.sku}
                      </div>

                      <div className="text-orange-500 font-black text-xl mt-2">
                        {getFinalRubPrice(product)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {normalizedQuery && (
                <Link
                  href={`/search?q=${encodeURIComponent(normalizedQuery)}`}
                  onClick={() => setOpen(false)}
                  className="block p-5 text-center text-orange-500 hover:bg-white/5 transition border-t border-zinc-800"
                >
                  Смотреть все результаты →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}