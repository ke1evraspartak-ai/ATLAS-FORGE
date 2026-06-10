"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportVSportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const importProducts = async () => {
    if (!file) {
      alert("Выберите XML файл");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-vsport", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Ошибка импорта");
        return;
      }

      alert(
        `Импорт завершен

Добавлено: ${result.inserted}
Обновлено: ${result.updated}
Всего товаров: ${result.total}`
      );
    } catch (error: any) {
      alert(error.message || "Ошибка импорта");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <Link
  href="/admin/products"
  className="inline-flex items-center text-zinc-400 hover:text-white transition mb-6"
>
  ← К товарам
</Link>
        <h1 className="text-5xl font-black">
          Импорт V-Sport
        </h1>

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

          <input
            type="file"
            accept=".xml,.yml"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
            className="w-full border border-zinc-700 rounded-xl p-4"
          />

          <button
            onClick={importProducts}
            disabled={loading}
            className="mt-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition px-8 py-4 rounded-xl font-bold"
          >
            {loading
              ? "Импортируем..."
              : "Импортировать XML"}
          </button>
        </div>
      </div>
    </main>
  );
}