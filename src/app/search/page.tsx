import Link from "next/link";
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let products: any[] = [];
  let sections: any[] = [];

  if (query) {
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .or(
        `name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%,section.ilike.%${query}%,category.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    const { data: sectionsData } = await supabase
      .from("catalog_sections")
      .select("*")
      .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
      .order("sort_order");

    products = productsData || [];
    sections = sectionsData || [];
  }

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <Link
          href="/catalog"
          className="text-zinc-400 hover:text-white transition"
        >
          ← В каталог
        </Link>

        <h1 className="text-6xl md:text-7xl font-black mt-8">
          Поиск
        </h1>

        <form className="mt-10 flex gap-4" action="/search">
          <input
            name="q"
            defaultValue={query}
            placeholder="Введите название, артикул или раздел"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-4"
          />

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-xl font-bold"
          >
            Найти
          </button>
        </form>

        {query && (
          <div className="text-zinc-500 mt-6">
            Результаты поиска по запросу:{" "}
            <span className="text-white">{query}</span>
          </div>
        )}

        {!query && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-12 text-zinc-400">
            Введите поисковый запрос.
          </div>
        )}

        {query && sections.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-black mb-6">
              Разделы
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/catalog/sections/${section.slug}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-orange-500/50 hover:-translate-y-2 transition-all"
                >
                  <div className="h-40 bg-white">
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
                    <h3 className="font-black">
                      {section.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {query && (
          <section className="mt-12">
            <h2 className="text-3xl font-black mb-6">
              Товары
            </h2>

            {products.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-zinc-400">
                Товары не найдены.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalog/${product.slug || product.id}`}
                    className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="h-72 bg-white">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain p-6"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          Нет фото
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-orange-500 text-xs uppercase tracking-widest">
                        {product.sku}
                      </p>

                      <h3 className="text-2xl font-bold mt-3">
                        {product.name}
                      </h3>

                      <div className="text-2xl font-black text-orange-500 mt-6">
                        {getFinalRubPrice(product)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}