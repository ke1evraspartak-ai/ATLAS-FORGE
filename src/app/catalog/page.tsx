import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function CatalogPage() {
  const { data: sections } = await supabase
    .from("catalog_sections")
    .select("*")
    .order("sort_order");

  const visibleSections = (sections || []).filter(
    (section) => section.is_hidden !== true
  );

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <h1 className="text-6xl md:text-7xl font-black">
          Каталог оборудования
        </h1>

        <p className="text-zinc-400 text-xl mt-6 max-w-3xl">
          Выберите раздел профессионального оборудования ATLAS FORGE.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mt-16">
          {visibleSections.map((section) => (
            <Link
              key={section.id}
              href={`/catalog/sections/${section.slug}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:-translate-y-2 hover:border-orange-500/50 transition-all duration-300"
            >
              <div className="h-44 bg-white">
                {section.image ? (
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    Нет фото
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="text-lg font-black leading-tight">
                  {section.title}
                </h2>

                <p className="text-zinc-500 text-sm mt-3 group-hover:text-orange-500 transition">
                  Смотреть →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}