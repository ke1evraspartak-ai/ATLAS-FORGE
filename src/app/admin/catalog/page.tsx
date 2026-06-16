"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminCatalogPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [subcategoryTitle, setSubcategoryTitle] = useState("");

  const loadData = async () => {
    const { data: sectionsData } = await supabase
      .from("catalog_sections")
      .select("*")
      .order("sort_order");

    const { data: subcategoriesData } = await supabase
      .from("catalog_subcategories")
      .select("*")
      .order("sort_order");

    setSections(sectionsData || []);
    setSubcategories(subcategoriesData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const translitMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  ь: "",
  ъ: "",
};

const makeSlug = (value: string) => {
  return value
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};
    
  const updateOrder = async (items: any[], table: string) => {
    for (let index = 0; index < items.length; index++) {
      await supabase
        .from(table)
        .update({ sort_order: index + 1 })
        .eq("id", items[index].id);
    }

    loadData();
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    setSections(newSections);
    await updateOrder(newSections, "catalog_sections");
  };

  const moveSubcategory = async (
    sectionId: string,
    index: number,
    direction: "up" | "down"
  ) => {
    const sectionItems = subcategories.filter(
      (item) => item.section_id === sectionId
    );

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sectionItems.length) return;

    [sectionItems[index], sectionItems[targetIndex]] = [
      sectionItems[targetIndex],
      sectionItems[index],
    ];

    await updateOrder(sectionItems, "catalog_subcategories");
  };

  const addSection = async () => {
    if (!title.trim()) return;

    const { error } = await supabase.from("catalog_sections").insert({
      title,
      slug: makeSlug(title),
      sort_order: sections.length + 1,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    loadData();
  };

  const addSubcategory = async () => {
    if (!selectedSectionId || !subcategoryTitle.trim()) return;

    const currentItems = subcategories.filter(
      (item) => item.section_id === selectedSectionId
    );

    const { error } = await supabase.from("catalog_subcategories").insert({
      section_id: selectedSectionId,
      title: subcategoryTitle,
      sort_order: currentItems.length + 1,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSubcategoryTitle("");
    loadData();
  };

  const uploadSectionImage = async (sectionId: string, file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `catalog/${Date.now()}-${sectionId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    const { error } = await supabase
      .from("catalog_sections")
      .update({ image: data.publicUrl })
      .eq("id", sectionId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const deleteSubcategory = async (id: string) => {
    if (!confirm("Удалить подраздел?")) return;

    await supabase.from("catalog_subcategories").delete().eq("id", id);

    loadData();
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Удалить раздел и все его подразделы?")) return;

    await supabase.from("catalog_sections").delete().eq("id", id);

    loadData();
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

        <h1 className="text-5xl font-black">Разделы каталога</h1>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">Добавить раздел</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название раздела"
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            />

            <button
              onClick={addSection}
              className="mt-4 bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold"
            >
              Добавить раздел
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">Добавить подраздел</h2>

            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            >
              <option value="">Выберите раздел</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>

            <input
              value={subcategoryTitle}
              onChange={(e) => setSubcategoryTitle(e.target.value)}
              placeholder="Название подраздела"
              className="w-full bg-black border border-zinc-700 rounded-xl p-4 mt-4"
            />

            <button
              onClick={addSubcategory}
              className="mt-4 bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold"
            >
              Добавить подраздел
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-12">
          {sections.map((section, sectionIndex) => {
            const sectionSubcategories = subcategories.filter(
              (item) => item.section_id === section.id
            );

            return (
              <div
                key={section.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
              >
                <div className="h-52 bg-white">
                  {section.image ? (
                    <img
                      src={section.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      Нет фото раздела
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between gap-4">
                    <input
  value={section.title}
  onChange={(e) => {
    const value = e.target.value;

    setSections((prev) =>
      prev.map((item) =>
        item.id === section.id
          ? {
              ...item,
              title: value,
              slug: makeSlug(value),
            }
          : item
      )
    );
  }}
  className="bg-black border border-zinc-700 rounded-xl px-4 py-2 text-xl font-bold w-full"
/>

                    <div className="flex gap-2">
                      <button
                        onClick={() => moveSection(sectionIndex, "up")}
                        disabled={sectionIndex === 0}
                        className="bg-black disabled:opacity-30 px-3 py-2 rounded-lg"
                      >
                        ↑
                      </button>

                      <button
                        onClick={() => moveSection(sectionIndex, "down")}
                        disabled={sectionIndex === sections.length - 1}
                        className="bg-black disabled:opacity-30 px-3 py-2 rounded-lg"
                      >
                        ↓
                      </button>
                    </div>
                    <button
  onClick={async () => {
    await supabase
      .from("catalog_sections")
      .update({
        title: section.title,
        slug: section.slug,
      })
      .eq("id", section.id);

    loadData();
  }}
  className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-xl text-sm font-bold"
>
  Сохранить
</button>
                  </div>
<div className="mt-4">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={section.is_hidden || false}
      onChange={async (e) => {
        await supabase
          .from("catalog_sections")
          .update({
            is_hidden: e.target.checked,
          })
          .eq("id", section.id);

        loadData();
      }}
    />

    <span className="text-sm text-zinc-300">
      Скрыть раздел на сайте
    </span>
  </label>
</div>
                  <label className="inline-block mt-4 border border-zinc-700 hover:border-orange-500 transition px-4 py-2 rounded-xl cursor-pointer">
                    Заменить фото
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadSectionImage(section.id, file);
                      }}
                    />
                  </label>

                  <div className="mt-6 space-y-2">
                    {sectionSubcategories.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center gap-2 bg-black rounded-xl px-4 py-3"
                      >
                        <input
  value={item.title}
  onChange={(e) => {
    const value = e.target.value;

    setSubcategories((prev) =>
      prev.map((sub) =>
        sub.id === item.id
          ? {
              ...sub,
              title: value,
            }
          : sub
      )
    );
  }}
  className="bg-transparent border border-zinc-700 rounded-lg px-3 py-1 w-full"
/>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              moveSubcategory(section.id, index, "up")
                            }
                            disabled={index === 0}
                            className="text-zinc-400 disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            onClick={() =>
                              moveSubcategory(section.id, index, "down")
                            }
                            disabled={index === sectionSubcategories.length - 1}
                            className="text-zinc-400 disabled:opacity-30"
                          >
                            ↓
                          </button>
<button
  onClick={async () => {
    await supabase
      .from("catalog_subcategories")
      .update({
        title: item.title,
      })
      .eq("id", item.id);

    loadData();
  }}
  className="text-orange-500"
>
  сохранить
</button>
                          <button
                            onClick={() => deleteSubcategory(item.id)}
                            className="text-red-500"
                          >
                            удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => deleteSection(section.id)}
                    className="mt-6 text-red-500 border border-red-500 px-4 py-2 rounded-xl"
                  >
                    Удалить раздел
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </main>
  );
}