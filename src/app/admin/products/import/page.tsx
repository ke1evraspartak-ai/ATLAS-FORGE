"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export default function ImportProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const cleanNumber = (value: any) => {
    return Number(String(value || "").replace(/[^\d]/g, ""));
  };

  const formatRub = (value: number) => {
    if (!value || value <= 0) return "";
    return `${value.toLocaleString("ru-RU")} ₽`;
  };

  const withUnit = (value: any, unit: string) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const number = cleanNumber(value);

    if (!number) return undefined;

    return `${number.toLocaleString("ru-RU")} ${unit}`;
  };

  const calculatePrice = (row: any) => {
    const rub = cleanNumber(row["Цена"]);
    if (rub) return formatRub(rub);

    const usd = cleanNumber(row["Цена $"]);
    const usdRate = cleanNumber(row["Курс $"]);

    if (usd && usdRate) {
      return formatRub(usd * usdRate);
    }

    const eur = cleanNumber(row["Цена €"]);
    const eurRate = cleanNumber(row["Курс €"]);

    if (eur && eurRate) {
      return formatRub(eur * eurRate);
    }

    return "";
  };

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(sheet);

    setRows(data);
  };

  const importProducts = async () => {
    setImporting(true);

    try {
      const products = rows.map((row: any) => {
        const specs: Record<string, string> = {};

        const weight = withUnit(row["Вес"], "кг");
        const length = withUnit(row["Длина"], "мм");
        const height = withUnit(row["Высота"], "мм");
        const width = withUnit(row["Ширина"], "мм");
        const maxLoad = withUnit(row["Макс. нагрузка"], "кг");

        if (weight) specs["Вес"] = weight;
        if (length) specs["Длина"] = length;
        if (height) specs["Высота"] = height;
        if (width) specs["Ширина"] = width;
        if (maxLoad) specs["Макс. нагрузка"] = maxLoad;

        return {
          sku: String(row["Артикул"] || row["SKU"] || "").trim(),

          name: String(row["Название"] || "").trim(),

          section: String(row["Раздел"] || "").trim(),

          category: String(row["Подраздел"] || "").trim(),

          price: calculatePrice(row),

          price_usd: row["Цена $"]
            ? String(cleanNumber(row["Цена $"]))
            : "",

          usd_rate: row["Курс $"]
            ? String(cleanNumber(row["Курс $"]))
            : "",

          price_eur: row["Цена €"]
            ? String(cleanNumber(row["Цена €"]))
            : "",

          eur_rate: row["Курс €"]
            ? String(cleanNumber(row["Курс €"]))
            : "",

          description: String(row["Описание"] || "").trim(),

          specs,

          images: [],
        };
      });

      const { error } = await supabase
        .from("products")
        .upsert(products, {
          onConflict: "sku",
        });

      if (error) {
        throw error;
      }

      alert("Импорт завершён");

      window.location.href = "/admin/products";
    } catch (error: any) {
      alert(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <a
          href="/admin/products"
          className="inline-block mb-8 text-zinc-400 hover:text-white transition"
        >
          ← К товарам
        </a>

        <h1 className="text-5xl font-black">
          Импорт товаров из Excel
        </h1>

        <p className="text-zinc-400 mt-6 max-w-3xl">
          Повторная загрузка файла обновляет товары по артикулу.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-10">
          <label className="inline-block bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold cursor-pointer">
            Выбрать Excel-файл

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleFile(file);
                }
              }}
            />
          </label>

          <div className="mt-8 text-zinc-400">
            Найдено строк: {rows.length}
          </div>

          {rows.length > 0 && (
            <>
              <div className="overflow-auto mt-6 border border-zinc-800 rounded-2xl max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="bg-black">
                    <tr>
                      {Object.keys(rows[0]).map((key) => (
                        <th
                          key={key}
                          className="text-left p-3 border-b border-zinc-800"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {Object.keys(rows[0]).map((key) => (
                          <td
                            key={key}
                            className="p-3 border-b border-zinc-800 text-zinc-300"
                          >
                            {String(row[key] || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={importProducts}
                disabled={importing}
                className="mt-8 bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-xl font-bold"
              >
                {importing ? "Импортируем..." : "Импортировать товары"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}