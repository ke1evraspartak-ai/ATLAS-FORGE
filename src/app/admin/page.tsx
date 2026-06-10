import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex justify-between items-center gap-4">
          <div>
            <span className="text-orange-500 uppercase tracking-[6px]">
              Atlas Forge CMS
            </span>

            <h1 className="text-5xl font-black mt-4">
              Товары
            </h1>
          </div>

          <div className="flex gap-4">
            <Link
              href="/admin/products/import"
              className="border border-zinc-700 hover:border-orange-500 transition px-6 py-3 rounded-xl"
            >
              Импорт Excel
            </Link>

            <Link
              href="/admin/products/new"
              className="bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold"
            >
              Добавить товар
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          {products?.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className="w-24 h-20 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-zinc-500 text-xs">
                      Нет фото
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {product.name}
                  </h2>

                  <p className="text-zinc-400 text-sm mt-1">
                    {product.sku} · {product.category} · {product.price}
                  </p>
                </div>
              </div>

              <Link
                href={`/admin/products/${product.id}/edit`}
                className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition px-5 py-2 rounded-xl"
              >
                Редактировать
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}