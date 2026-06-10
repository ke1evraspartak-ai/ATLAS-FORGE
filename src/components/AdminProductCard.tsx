"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminProductCard({
  product,
}: {
  product: any;
}) {
  const [saving, setSaving] = useState(false);

  const [priceRub, setPriceRub] = useState(product.price || "");
  const [priceUsd, setPriceUsd] = useState(product.price_usd || "");
  const [usdRate, setUsdRate] = useState(product.usd_rate || "");
  const [priceEur, setPriceEur] = useState(product.price_eur || "");
  const [eurRate, setEurRate] = useState(product.eur_rate || "");

  const formatNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("ru-RU");
  };

const formatPriceRub = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ru-RU");
};

  const getFinalRubPrice = () => {
    const usd = Number(priceUsd.replace(/\D/g, ""));
    const rateUsd = Number(usdRate.replace(/\D/g, ""));

    if (usd && rateUsd) {
      return `${(usd * rateUsd).toLocaleString("ru-RU")} ₽`;
    }

    const eur = Number(priceEur.replace(/\D/g, ""));
    const rateEur = Number(eurRate.replace(/\D/g, ""));

    if (eur && rateEur) {
      return `${(eur * rateEur).toLocaleString("ru-RU")} ₽`;
    }

    return priceRub ? `${priceRub} ₽` : "";
  };

  const savePrice = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        price: priceRub,
        price_usd: priceUsd,
        usd_rate: usdRate,
        price_eur: priceEur,
        eur_rate: eurRate,
      })
      .eq("id", product.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Цена обновлена");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className="aspect-square bg-white">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt=""
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            Нет фото
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs text-orange-500 uppercase tracking-widest">
          {product.sku}
        </div>

        <h2 className="text-lg font-bold mt-2 line-clamp-2">
          {product.name}
        </h2>

        <div className="mt-4 bg-black/60 border border-zinc-800 rounded-2xl p-3 space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Цена ₽
            </label>

            <input
              value={priceRub}
              onChange={(e) => {
                setPriceRub(formatPriceRub(e.target.value));
                setPriceUsd("");
                setUsdRate("");
                setPriceEur("");
                setEurRate("");
              }}
              className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm"
              placeholder="49 900 ₽"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Цена $
              </label>

              <input
                value={priceUsd}
                onChange={(e) => {
                  setPriceUsd(formatNumber(e.target.value));
                  setPriceRub("");
                  setPriceEur("");
                  setEurRate("");
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Курс $
              </label>

              <input
                value={usdRate}
                onChange={(e) => {
                  setUsdRate(formatNumber(e.target.value));
                  setPriceRub("");
                  setPriceEur("");
                  setEurRate("");
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm"
                placeholder="99"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Цена €
              </label>

              <input
                value={priceEur}
                onChange={(e) => {
                  setPriceEur(formatNumber(e.target.value));
                  setPriceRub("");
                  setPriceUsd("");
                  setUsdRate("");
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm"
                placeholder="450"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Курс €
              </label>

              <input
                value={eurRate}
                onChange={(e) => {
                  setEurRate(formatNumber(e.target.value));
                  setPriceRub("");
                  setPriceUsd("");
                  setUsdRate("");
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl p-2 text-sm"
                placeholder="105"
              />
            </div>
          </div>

          <div className="border border-orange-500/30 rounded-xl p-2">
            <div className="text-xs text-zinc-500">
              Цена на сайте
            </div>

            <div className="text-orange-500 font-black">
              {getFinalRubPrice() || "Не указана"}
            </div>
          </div>

          <button
            onClick={savePrice}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 transition py-2 rounded-xl font-bold text-sm"
          >
            {saving ? "Сохраняем..." : "Сохранить цену"}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="flex-1 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition py-2 rounded-xl text-center text-sm"
          >
            Редактировать
          </Link>

          <Link
            href={`/catalog/${product.id}`}
            className="flex-1 border border-zinc-700 hover:border-white transition py-2 rounded-xl text-center text-sm"
          >
            Открыть
          </Link>
        </div>
      </div>
    </div>
  );
}