"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type GroupedFiles = {
  sku: string;
  files: File[];
};

export default function PhotosImportPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const getSkuFromFileName = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

    return nameWithoutExt
      .replace(/[_-]\d+$/, "")
      .trim()
      .toUpperCase();
  };

  const groupedFiles: GroupedFiles[] = Object.values(
    files.reduce((acc: Record<string, GroupedFiles>, file) => {
      const sku = getSkuFromFileName(file.name);

      if (!acc[sku]) {
        acc[sku] = {
          sku,
          files: [],
        };
      }

      acc[sku].files.push(file);

      return acc;
    }, {})
  ).map((group) => ({
    ...group,
    files: group.files.sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const makeSafeFileName = (sku: string, file: File, index: number) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const random = Math.random().toString(36).substring(2, 10);

    return `products/${sku}/${index + 1}-${Date.now()}-${random}.${extension}`;
  };

  const uploadPhotos = async () => {
    setUploading(true);

    try {
      for (const group of groupedFiles) {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, images")
          .eq("sku", group.sku)
          .single();

        if (productError || !product) {
          console.warn(`Товар с артикулом ${group.sku} не найден`);
          continue;
        }

        const uploadedUrls: string[] = [];

        for (let index = 0; index < group.files.length; index++) {
          const file = group.files[index];
          const filePath = makeSafeFileName(group.sku, file, index);

          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from("products")
            .getPublicUrl(filePath);

          uploadedUrls.push(data.publicUrl);
        }

        const finalImages = [
          ...uploadedUrls,
          ...(product.images || []),
        ];

        const { error: updateError } = await supabase
          .from("products")
          .update({
            images: finalImages,
          })
          .eq("id", product.id);

        if (updateError) {
          throw updateError;
        }
      }

      alert("Фотографии загружены и привязаны к товарам");
      window.location.href = "/admin/products";
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
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
          Массовая загрузка фото
        </h1>

        <p className="text-zinc-400 mt-6 max-w-3xl">
          Названия файлов должны начинаться с артикула товара.
          Например: ABP-009_1.jpg, ABP-009_2.jpg.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-10">
          <label className="inline-block bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold cursor-pointer">
            Выбрать фотографии

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []))
              }
            />
          </label>

          <div className="mt-8 text-zinc-400">
            Выбрано файлов: {files.length}
          </div>

          {groupedFiles.length > 0 && (
            <div className="mt-8 space-y-6">
              {groupedFiles.map((group) => (
                <div
                  key={group.sku}
                  className="bg-black rounded-2xl border border-zinc-800 p-5"
                >
                  <div className="text-orange-500 font-bold">
                    {group.sku}
                  </div>

                  <div className="text-zinc-500 text-sm mt-1">
                    Фото: {group.files.length}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                    {group.files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="bg-white rounded-xl h-28 overflow-hidden relative"
                      >
                        {index === 0 && (
                          <div className="absolute left-2 top-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-lg">
                            Главное
                          </div>
                        )}

                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={uploadPhotos}
              disabled={uploading}
              className="mt-8 bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-xl font-bold"
            >
              {uploading
                ? "Загружаем..."
                : "Загрузить и привязать фото"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}