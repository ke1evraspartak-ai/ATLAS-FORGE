import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import BackButton from "@/components/BackButton";
import AddToCartButton from "@/components/AddToCartButton";

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

async function getProduct(id: string) {
  const pageParam = decodeURIComponent(id);

  let { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", pageParam)
    .maybeSingle();

  if (!product) {
    const result = await supabase
      .from("products")
      .select("*")
      .eq("id", pageParam)
      .maybeSingle();

    product = result.data;
  }

  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Товар не найден",
    };
  }

  return {
    title: product.meta_title || product.name,
    description:
      product.meta_description ||
      product.description ||
      `${product.name} — профессиональное фитнес-оборудование.`,
    openGraph: {
      title: product.meta_title || product.name,
      description:
        product.meta_description ||
        product.description ||
        `${product.name} — профессиональное фитнес-оборудование.`,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const { data: section } = await supabase
    .from("catalog_sections")
    .select("*")
    .eq("title", product.section)
    .maybeSingle();

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/placeholder.jpg"];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: images,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: cleanNumber(getFinalRubPrice(product)),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="mb-10">
          <div className="text-sm text-zinc-500">
            <Link href="/" className="hover:text-orange-500">
              Главная
            </Link>

            <span className="mx-2">/</span>

            <Link href="/catalog" className="hover:text-orange-500">
              Каталог
            </Link>

            {section && (
              <>
                <span className="mx-2">/</span>

                <Link
                  href={`/catalog/sections/${section.slug}`}
                  className="hover:text-orange-500"
                >
                  {section.title}
                </Link>
              </>
            )}

            <span className="mx-2">/</span>

            <span className="text-zinc-300">{product.name}</span>
          </div>

          <div className="mt-6">
            <BackButton />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <ProductGallery images={images} />

          <div>
            <span className="text-orange-500 uppercase tracking-widest">
              {product.category}
            </span>

            <h1 className="text-5xl font-black mt-4">{product.name}</h1>

            <div className="flex items-center gap-4 mt-8">
  <div className="text-4xl font-black text-orange-500">
    {getFinalRubPrice(product)}
  </div>

  <AddToCartButton product={product} />
</div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Характеристики</h2>

              <div className="p-8 bg-zinc-900 rounded-3xl space-y-4">
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span>Артикул</span>
                  <span>{product.sku}</span>
                </div>

                {product.specs &&
                  Object.entries(product.specs).map(([key, value]) => {
                    if (!value || String(value) === "0") return null;

                    return (
                      <div
                        key={key}
                        className="flex justify-between border-b border-zinc-800 pb-3"
                      >
                        <span>{key}</span>
                        <span>{String(value)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <h2 className="text-3xl font-black mb-6">Описание</h2>

          <div className="bg-zinc-900 rounded-3xl p-8 text-zinc-400 text-lg leading-relaxed">
            <div
  className="product-description"
  dangerouslySetInnerHTML={{ __html: product.description || "" }}
/>
          </div>
        </section>
      </div>
    </main>
  );
}