import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AddToCartButton from "@/components/AddToCartButton";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function getSection(slug: string) {
  const pageSlug = decodeURIComponent(slug);

  const { data: section } = await supabase
    .from("catalog_sections")
    .select("*")
    .eq("slug", pageSlug)
    .maybeSingle();

  return section;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) {
    return {
      title: "Раздел не найден",
    };
  }

  return {
    title: `${section.title} — каталог ATLAS FORGE`,
    description: `Профессиональное фитнес-оборудование в разделе ${section.title}. Каталог ATLAS FORGE.`,
    openGraph: {
      title: `${section.title} — каталог ATLAS FORGE`,
      description: `Профессиональное фитнес-оборудование в разделе ${section.title}.`,
      images: section.image ? [section.image] : [],
    },
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;

  const section = await getSection(slug);

  if (!section) {
    notFound();
  }

  const { data: sections } = await supabase
    .from("catalog_sections")
    .select("*")
    .order("sort_order");

  const { data: subcategories } = await supabase
    .from("catalog_subcategories")
    .select("*")
    .eq("section_id", section.id)
    .order("sort_order");

  const { data: allSectionProducts } = await supabase
    .from("products")
    .select("*")
    .eq("section", section.title)
    .order("created_at", { ascending: false });

  const dynamicCategories = Array.from(
    new Set(
      allSectionProducts
        ?.map((product) => product.category)
        .filter(Boolean)
    )
  );

  const allCategories = Array.from(
    new Set([
      ...(subcategories || []).map((item) => item.title),
      ...dynamicCategories,
    ])
  );

  const products = category
    ? allSectionProducts?.filter((product) => product.category === category)
    : allSectionProducts;

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1600px] mx-auto px-6 py-32">
        <div className="text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-orange-500">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link href="/catalog" className="hover:text-orange-500">
            Каталог
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">{section.title}</span>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-10 items-start">
          <aside className="lg:sticky lg:top-28 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6">
  <div className="text-xs uppercase tracking-[4px] text-orange-500 mb-5">
    Категории
  </div>

  <div className="space-y-3">
   {sections
  ?.filter((item) => item.is_hidden !== true)
  .map((item) => {
    const active = item.slug === section.slug;

    return (
        <div key={item.id}>
          <Link
            href={`/catalog/sections/${item.slug}`}
            className={`block rounded-xl px-4 py-3 text-sm transition ${
              active
                ? "bg-orange-500 text-white font-bold"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.title}
          </Link>

          {active && allCategories.length > 0 && (
            <div className="mt-2 ml-2 space-y-2 border-l border-zinc-800 pl-4">
             

              {allCategories.map((subcategory) => (
                <Link
                  key={subcategory}
                  href={`/catalog/sections/${section.slug}?category=${encodeURIComponent(
                    subcategory
                  )}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    category === subcategory
                      ? "bg-white text-black font-bold"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {subcategory}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
</aside>

          <section>
            <Link
              href="/catalog"
              className="text-zinc-400 hover:text-white transition"
            >
              ← К разделам каталога
            </Link>

            <h1 className="text-5xl md:text-7xl font-black mt-8">
              {section.title}
            </h1>

            <div className="text-zinc-500 mt-4">
              Найдено товаров: {products?.length || 0}
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-12">
              {products?.map((product) => (
                <div
  key={product.id}
  className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-300"
>
  <Link href={`/catalog/${product.slug || product.id}`}>
    <div className="h-72 bg-white">
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt=""
          className="w-full h-full object-contain p-6"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-500">
          Нет фото
        </div>
      )}
    </div>
  </Link>

  <div className="p-6">
    <p className="text-orange-500 text-xs uppercase tracking-widest">
      {product.sku}
    </p>

    <Link href={`/catalog/${product.slug || product.id}`}>
      <h2 className="text-2xl font-bold mt-3 hover:text-orange-500 transition">
        {product.name}
      </h2>
    </Link>

    <div className="flex items-center justify-between mt-6 gap-3">
  <div className="text-2xl font-black text-orange-500">
    {getFinalRubPrice(product)}
  </div>

  <AddToCartButton product={product} />
</div>
  </div>
</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}