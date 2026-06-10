"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditProductForm({ product }: { product: any }) {
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<string[]>(product.images || []);
  const [sections, setSections] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: product.name || "",
    sku: product.sku || "",
    section: product.section || "",
    category: product.category || "",
    price: product.price || "",
    price_usd: product.price_usd || "",
    usd_rate: product.usd_rate || "",
    price_eur: product.price_eur || "",
    eur_rate: product.eur_rate || "",
    description: product.description || "",
    weight: product.specs?.["Вес"] || "",
    length: product.specs?.["Длина"] || "",
    height: product.specs?.["Высота"] || "",
    width: product.specs?.["Ширина"] || "",
    maxLoad: product.specs?.["Макс. нагрузка"] || "",
    slug: product.slug || "",
    meta_title: product.meta_title || "",
    meta_description: product.meta_description || "",
  });

  useEffect(() => {
    const loadCatalog = async () => {
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

    loadCatalog();
  }, []);

  const selectedSection = sections.find((item) => item.title === form.section);

  const availableSubcategories = selectedSection
    ? subcategories.filter((item) => item.section_id === selectedSection.id)
    : [];

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
    ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ы: "y", э: "e", ю: "yu", я: "ya", ь: "", ъ: "",
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

  const updateSection = (value: string) => {
    setForm((prev) => ({
      ...prev,
      section: value,
      category: "",
    }));
  };

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
    const usd = Number(form.price_usd.replace(/\D/g, ""));
    const usdRate = Number(form.usd_rate.replace(/\D/g, ""));

    if (usd && usdRate) {
      return `${(usd * usdRate).toLocaleString("ru-RU")} ₽`;
    }

    const eur = Number(form.price_eur.replace(/\D/g, ""));
    const eurRate = Number(form.eur_rate.replace(/\D/g, ""));

    if (eur && eurRate) {
      return `${(eur * eurRate).toLocaleString("ru-RU")} ₽`;
    }

    return form.price ? `${form.price} ₽` : "";
  };

  const withUnit = (value: string, unit: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits || digits === "0") return "";
    return `${Number(digits).toLocaleString("ru-RU")} ${unit}`;
  };

  const makeSafeFileName = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const random = Math.random().toString(36).substring(2, 10);
    return `products/${Date.now()}-${random}.${extension}`;
  };

  const uploadImages = async () => {
    const urls: string[] = [];

    for (const file of files) {
      const filePath = makeSafeFileName(file);

      const { error } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const removeExistingImage = (index: number) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveImageLeft = (index: number) => {
    if (index === 0) return;

    setImages((prev) => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  };

  const moveImageRight = (index: number) => {
    if (index === images.length - 1) return;

    setImages((prev) => {
      const copy = [...prev];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
  };

  const removeNewFile = (index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const addSpec = (
    specs: Record<string, string>,
    key: string,
    value: string
  ) => {
    if (value && value.trim() !== "" && value.trim() !== "0") {
      specs[key] = value.trim();
    }
  };

  const saveProduct = async () => {
    setSaving(true);

    try {
      const uploadedImages = await uploadImages();
      const finalImages = [...images, ...uploadedImages];

      const specs: Record<string, string> = {};

      addSpec(specs, "Вес", form.weight);
      addSpec(specs, "Длина", form.length);
      addSpec(specs, "Высота", form.height);
      addSpec(specs, "Ширина", form.width);
      addSpec(specs, "Макс. нагрузка", form.maxLoad);

      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          sku: form.sku,
          section: form.section,
          category: form.category,
          price: form.price,
          price_usd: form.price_usd,
          usd_rate: form.usd_rate,
          price_eur: form.price_eur,
          eur_rate: form.eur_rate,
          description: form.description,
          images: finalImages,
          specs,
          slug: form.slug || makeSlug(`${form.sku}-${form.name}`),

meta_title:
  form.meta_title ||
  form.name,

meta_description:
  form.meta_description ||
  form.description?.slice(0, 160) ||
  form.name,
        })
        .eq("id", product.id);

      if (error) throw error;

      alert("Товар обновлён");
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    const confirmed = confirm("Удалить товар?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/admin/products";
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-32">
        <a
          href="/admin/products"
          className="inline-block mb-8 text-zinc-400 hover:text-white transition"
        >
          ← К списку товаров
        </a>

        <h1 className="text-5xl font-black">Редактирование товара</h1>

        <div className="space-y-10 mt-12">
          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Основная информация</h2>

            <div className="space-y-5">
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Название товара" value={form.name} onChange={(e) => update("name", e.target.value)} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Артикул" value={form.sku} onChange={(e) => update("sku", e.target.value)} />

              <select className="w-full bg-black border border-zinc-700 rounded-xl p-4" value={form.section} onChange={(e) => updateSection(e.target.value)}>
                <option value="">Выберите раздел каталога</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.title}>
                    {section.title}
                  </option>
                ))}
              </select>

              <select className="w-full bg-black border border-zinc-700 rounded-xl p-4" value={form.category} disabled={!form.section || availableSubcategories.length === 0} onChange={(e) => update("category", e.target.value)}>
                <option value="">
                  {form.section ? "Выберите подраздел" : "Сначала выберите раздел"}
                </option>

                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.title}>
                    {subcategory.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Цена</h2>

            <div className="grid md:grid-cols-2 gap-5">
              <input className="md:col-span-2 w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Цена в рублях" value={form.price} onChange={(e) => update("price", formatPriceRub(e.target.value))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Цена в $" value={form.price_usd} onChange={(e) => update("price_usd", formatNumber(e.target.value))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Курс $" value={form.usd_rate} onChange={(e) => update("usd_rate", formatNumber(e.target.value))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Цена в €" value={form.price_eur} onChange={(e) => update("price_eur", formatNumber(e.target.value))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Курс €" value={form.eur_rate} onChange={(e) => update("eur_rate", formatNumber(e.target.value))} />

              <div className="md:col-span-2 bg-black rounded-xl border border-orange-500/40 p-4">
                <div className="text-zinc-400 text-sm">Итоговая цена на сайте</div>
                <div className="text-3xl font-black text-orange-500 mt-2">
                  {getFinalRubPrice() || "Не указана"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Фотографии</h2>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative bg-white rounded-xl overflow-hidden h-40">
                    {index === 0 && (
                      <div className="absolute left-2 top-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        Главное
                      </div>
                    )}

                    <img src={image} alt="" className="w-full h-full object-contain p-2" />

                    <button onClick={() => removeExistingImage(index)} className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-8 h-8">
                      ×
                    </button>

                    <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                      <button onClick={() => moveImageLeft(index)} disabled={index === 0} className="flex-1 bg-black/80 disabled:opacity-30 text-white rounded-lg py-1">
                        ←
                      </button>

                      <button onClick={() => moveImageRight(index)} disabled={index === images.length - 1} className="flex-1 bg-black/80 disabled:opacity-30 text-white rounded-lg py-1">
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="inline-block bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold cursor-pointer">
              Добавить фотографии
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative bg-white rounded-xl overflow-hidden h-36">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-contain p-2" />

                    <button onClick={() => removeNewFile(index)} className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-8 h-8">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Описание</h2>

            <textarea
              className="w-full bg-black border border-zinc-700 rounded-xl p-4 min-h-48"
              placeholder="Описание товара"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Характеристики</h2>

            <div className="grid md:grid-cols-2 gap-5">
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Вес, кг" value={form.weight} onChange={(e) => update("weight", withUnit(e.target.value, "кг"))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Длина, мм" value={form.length} onChange={(e) => update("length", withUnit(e.target.value, "мм"))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Высота, мм" value={form.height} onChange={(e) => update("height", withUnit(e.target.value, "мм"))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4" placeholder="Ширина, мм" value={form.width} onChange={(e) => update("width", withUnit(e.target.value, "мм"))} />
              <input className="w-full bg-black border border-zinc-700 rounded-xl p-4 md:col-span-2" placeholder="Макс. нагрузка, кг" value={form.maxLoad} onChange={(e) => update("maxLoad", withUnit(e.target.value, "кг"))} />
            </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">SEO</h2>

            <div className="space-y-5">
              <input
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                placeholder="SEO URL / slug"
                value={form.slug}
                onChange={(e) => update("slug", makeSlug(e.target.value))}
              />

              <input
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                placeholder="Meta Title"
                value={form.meta_title}
                onChange={(e) => update("meta_title", e.target.value)}
              />

              <textarea
                className="w-full bg-black border border-zinc-700 rounded-xl p-4 min-h-32"
                placeholder="Meta Description"
                value={form.meta_description}
                onChange={(e) => update("meta_description", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={saveProduct} disabled={saving} className="bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-xl font-bold">
              {saving ? "Сохраняем..." : "Сохранить изменения"}
            </button>

            <button onClick={deleteProduct} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition px-8 py-4 rounded-xl font-bold">
              Удалить товар
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}