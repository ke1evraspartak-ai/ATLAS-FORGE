"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminProductCard from "@/components/AdminProductCard";

export default function AdminProductsClient({
  products,
  sections,
  subcategories,
}: {
  products: any[];
  sections: any[];
  subcategories: any[];
}) {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moveSection, setMoveSection] = useState("");
  const [moveCategory, setMoveCategory] = useState("");

  const selectedSection = sections.find((item) => item.title === section);

  const availableSubcategories = selectedSection
    ? subcategories.filter((item) => item.section_id === selectedSection.id)
    : subcategories;

  const selectedMoveSection = sections.find(
    (item) => item.title === moveSection
  );

  const moveSubcategories = selectedMoveSection
    ? subcategories.filter((item) => item.section_id === selectedMoveSection.id)
    : [];

  const filtered = products.filter((product) => {
    const query = search.toLowerCase();

    const matchesSearch =
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query);

    const matchesSection = section ? product.section === section : true;
    const matchesCategory = category ? product.category === category : true;

    const matchesPhoto =
      photo === "with"
        ? product.images?.length > 0
        : photo === "without"
        ? !product.images?.length
        : true;

    return matchesSearch && matchesSection && matchesCategory && matchesPhoto;
  });

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds(filtered.map((product) => product.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const moveSelected = async () => {
    if (selectedIds.length === 0) return;

    if (!moveSection) {
      alert("Выберите раздел для перемещения");
      return;
    }

    if (!moveCategory) {
      alert("Выберите подраздел для перемещения");
      return;
    }

    const confirmed = confirm(
      `Переместить выбранные товары: ${selectedIds.length} шт.?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .update({
        section: moveSection,
        category: moveCategory,
      })
      .in("id", selectedIds);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Выбранные товары перемещены");
    setSelectedIds([]);
    window.location.reload();
  };

  const deleteSelected = async () => {
  if (selectedIds.length === 0) return;

  const confirmed = confirm(
    `Удалить выбранные товары: ${selectedIds.length} шт.?`
  );

  if (!confirmed) return;

  const chunkSize = 100;

  for (let i = 0; i < selectedIds.length; i += chunkSize) {
    const chunk = selectedIds.slice(i, i + chunkSize);

    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", chunk);

    if (error) {
      alert(error.message);
      return;
    }
  }

  alert("Выбранные товары удалены");
  setSelectedIds([]);
  window.location.reload();
};

  return (
    <>
      <div className="grid md:grid-cols-4 gap-4 mt-10">
        <input
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          placeholder="Поиск по названию или артикулу"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          value={section}
          onChange={(e) => {
            setSection(e.target.value);
            setCategory("");
          }}
        >
          <option value="">Все разделы</option>

          {sections.map((item) => (
            <option key={item.id} value={item.title}>
              {item.title}
            </option>
          ))}
        </select>

        <select
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Все подразделы</option>

          {availableSubcategories.map((item) => (
            <option key={item.id} value={item.title}>
              {item.title}
            </option>
          ))}
        </select>

        <select
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
        >
          <option value="">Все фото</option>
          <option value="with">С фото</option>
          <option value="without">Без фото</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-6">
        <div className="text-zinc-500">
          Найдено товаров: {filtered.length}
        </div>

        <button
          onClick={selectAllFiltered}
          className="border border-zinc-700 hover:border-orange-500 transition px-4 py-2 rounded-xl text-sm"
        >
          Выбрать найденные
        </button>

        <button
          onClick={clearSelection}
          className="border border-zinc-700 hover:border-white transition px-4 py-2 rounded-xl text-sm"
        >
          Снять выбор
        </button>

        {selectedIds.length > 0 && (
          <>
            <div className="text-orange-500">
              Выбрано: {selectedIds.length}
            </div>

            <select
              value={moveSection}
              onChange={(e) => {
                setMoveSection(e.target.value);
                setMoveCategory("");
              }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm"
            >
              <option value="">Куда: раздел</option>
              {sections.map((item) => (
                <option key={item.id} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>

            <select
              value={moveCategory}
              onChange={(e) => setMoveCategory(e.target.value)}
              disabled={!moveSection}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm disabled:opacity-40"
            >
              <option value="">Куда: подраздел</option>
              {moveSubcategories.map((item) => (
                <option key={item.id} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>

            <button
              onClick={moveSelected}
              className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-xl text-sm font-bold"
            >
              Переместить выбранные
            </button>

            <button
              onClick={deleteSelected}
              className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition px-4 py-2 rounded-xl text-sm"
            >
              Удалить выбранные
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
        {filtered.map((product) => (
          <div key={product.id} className="relative">
            <label className="absolute top-3 left-3 z-20 bg-black/80 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(product.id)}
                onChange={() => toggleProduct(product.id)}
              />
              <span className="text-xs">Выбрать</span>
            </label>

            <AdminProductCard product={product} />
          </div>
        ))}
      </div>
    </>
  );
}