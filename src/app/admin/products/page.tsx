import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminProductsClient from "@/components/AdminProductsClient";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: sections } = await supabase
    .from("catalog_sections")
    .select("*")
    .order("sort_order");

  const { data: subcategories } = await supabase
    .from("catalog_subcategories")
    .select("*")
    .order("sort_order");

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-20">
         <AdminHeader />
        <h1 className="text-5xl font-black">Товары</h1>

        <div className="flex flex-wrap items-center gap-4 mt-8 mb-10">
          <Link
            href="/admin/products/new"
            className="bg-orange-500 hover:bg-orange-600 transition px-6 py-3 rounded-xl font-bold"
          >
            + Добавить товар
          </Link>

          <Link
            href="/admin/products/import"
            className="bg-green-600 hover:bg-green-700 transition px-6 py-3 rounded-xl font-bold"
          >
            Импорт Excel
          </Link>
          <Link
  href="/admin/products/import-vsport"
  className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-bold"
>
  Импорт V-Sport
</Link>

          <Link
            href="/admin/catalog"
            className="border border-zinc-700 hover:border-orange-500 hover:text-orange-500 transition px-6 py-3 rounded-xl font-bold"
          >
            Разделы каталога
          </Link>
<Link
  href="/admin/products/photos"
  className="border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition px-6 py-3 rounded-xl font-bold"
>
  Загрузка фото
</Link>
<Link
  href="/admin/managers"
  className="border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
>
  Менеджеры
</Link>
        </div>

        <AdminProductsClient
          products={products || []}
          sections={sections || []}
          subcategories={subcategories || []}
        />
      </div>
    </main>
  );
}