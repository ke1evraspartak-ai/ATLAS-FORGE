"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const formatRub = (value: number) => {
  if (!value) return "0 ₽";
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
};

export default function ManagerAnalyticsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadData = async () => {
    const { data: offersData } = await supabase
      .from("commercial_offers")
      .select("*");

    const { data: itemsData } = await supabase
      .from("commercial_offer_items")
      .select("*, product:products(*)");
      const { data: managersData } = await supabase
  .from("managers")
  .select("*")
  .order("sort_order");

    const { data: tasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    setOffers(offersData || []);
    setItems(itemsData || []);
    setManagers(managersData || []);
    setTasks(tasksData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const analytics = useMemo(() => {
  const byStatus = (status: string) =>
    offers.filter((offer) => offer.status === status);

  const implementedOffers = byStatus("implemented");

  const implementedIds = implementedOffers.map((offer) => offer.id);

  const implementedItems = items.filter((item) =>
    implementedIds.includes(item.offer_id)
  );

  const implementedSum = implementedItems.reduce((sum, item) => {
    return sum + Number(item.custom_price || 0) * Number(item.quantity || 1);
  }, 0);

  const averageCheck =
    implementedOffers.length > 0
      ? implementedSum / implementedOffers.length
      : 0;

  const productMap: Record<string, any> = {};

  items.forEach((item) => {
    const name =
      item.custom_name ||
      item.product?.name ||
      "Без названия";

    if (!productMap[name]) {
      productMap[name] = {
        name,
        quantity: 0,
        sum: 0,
      };
    }

    productMap[name].quantity += Number(item.quantity || 1);
    productMap[name].sum +=
      Number(item.custom_price || 0) * Number(item.quantity || 1);
  });

  const topProducts = Object.values(productMap)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 10);

  const managerMap: Record<string, any> = {};

  offers.forEach((offer) => {
    const manager = managers.find(
      (item) => item.id === offer.manager_id
    );

    const managerName =
      manager?.name || "Без менеджера";

    if (!managerMap[managerName]) {
      managerMap[managerName] = {
        name: managerName,
        count: 0,
        implemented: 0,
      };
    }

    managerMap[managerName].count += 1;

    if (offer.status === "implemented") {
      managerMap[managerName].implemented += 1;
    }
  });

  const cityMap: Record<string, any> = {};

  offers.forEach((offer) => {
    const city = offer.city || "Без города";

    if (!cityMap[city]) {
      cityMap[city] = {
        name: city,
        count: 0,
        implemented: 0,
      };
    }

    cityMap[city].count += 1;

    if (offer.status === "implemented") {
      cityMap[city].implemented += 1;
    }
  });

  return {
    total: offers.length,
    new: byStatus("new").length,
    work: byStatus("work").length,
    sent: byStatus("sent").length,
    implemented: implementedOffers.length,
    closed: byStatus("closed").length,
    draft: byStatus("draft").length,
    implementedSum,
    averageCheck,
    topProducts,
    managerAnalytics: Object.values(managerMap),
    cityAnalytics: Object.values(cityMap),
  };
}, [offers, items, managers]);

  const openTasksCount = tasks.filter((task) => task.status !== "done").length;

  const newCartLeadsCount = offers.filter(
    (offer) => offer.source === "cart" && (offer.status === "new" || !offer.status)
  ).length;

  const cards = [
    ["Всего КП", analytics.total],
    ["Новые", analytics.new],
    ["В работе", analytics.work],
    ["КП отправлено", analytics.sent],
    ["Реализовано", analytics.implemented],
    ["Закрыто", analytics.closed],
    ["Черновики", analytics.draft],
  ];

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-15">
        <h1 className="text-6xl font-black mt-8">
          Аналитика
        </h1>

        <div className="flex flex-wrap items-center gap-4 mt-8">
          <Link
            href="/manager"
            className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-6 py-3 font-bold"
          >
            Конструктор КП
          </Link>

          <Link
            href="/manager/clients"
            className="bg-zinc-900 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
          >
            Клиенты CRM
          </Link>

          <Link
            href="/manager/tasks"
            className="relative bg-zinc-900 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
          >
            Задачи
            {openTasksCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center">
                {openTasksCount}
              </span>
            )}
          </Link>

          <Link
            href="/manager/leads"
            className="relative bg-zinc-900 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
          >
            Заявки
            {newCartLeadsCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-green-500 text-black text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center font-black">
                {newCartLeadsCount}
              </span>
            )}
          </Link>
          <Link
  href="/manager/analytics"
  className="bg-zinc-900 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
>
  Аналитика
</Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-12">
          {cards.map(([title, value]) => (
            <div
              key={title}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
            >
              <div className="text-zinc-500">
                {title}
              </div>

              <div className="text-5xl font-black mt-4 text-orange-500">
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-2 gap-8 mt-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black">
              Финансы
            </h2>

            <div className="mt-8 space-y-5">
              <div className="flex justify-between border-b border-zinc-800 pb-4">
                <span className="text-zinc-400">
                  Сумма реализованных КП
                </span>

                <span className="text-orange-500 font-black text-2xl">
                  {formatRub(analytics.implementedSum)}
                </span>
              </div>

              <div className="flex justify-between border-b border-zinc-800 pb-4">
                <span className="text-zinc-400">
                  Средний чек
                </span>

                <span className="text-white font-black text-2xl">
                  {formatRub(analytics.averageCheck)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black">
              Топ товаров
            </h2>

            <div className="mt-6 overflow-auto border border-zinc-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-black text-zinc-400">
                  <tr>
                    <th className="p-4 text-left">Товар</th>
                    <th className="p-4 text-center">Кол-во</th>
                    <th className="p-4 text-right">Сумма</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.topProducts.map((product: any) => (
                    <tr
                      key={product.name}
                      className="border-b border-zinc-800"
                    >
                      <td className="p-4 font-bold">
                        {product.name}
                      </td>

                      <td className="p-4 text-center">
                        {product.quantity}
                      </td>

                      <td className="p-4 text-right text-orange-500 font-bold">
                        {formatRub(product.sum)}
                      </td>
                    </tr>
                  ))}

                  {analytics.topProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-8 text-center text-zinc-500"
                      >
                        Данных пока нет.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
                <div className="grid xl:grid-cols-2 gap-8 mt-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black">
              Аналитика по менеджерам
            </h2>

            <div className="mt-6 overflow-auto border border-zinc-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-black text-zinc-400">
                  <tr>
                    <th className="p-4 text-left">Менеджер</th>
                    <th className="p-4 text-center">Всего КП</th>
                    <th className="p-4 text-center">Реализовано</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.managerAnalytics.map((manager: any) => (
                    <tr key={manager.name} className="border-b border-zinc-800">
                      <td className="p-4 font-bold">{manager.name}</td>
                      <td className="p-4 text-center">{manager.count}</td>
                      <td className="p-4 text-center text-lime-400 font-bold">
                        {manager.implemented}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black">
              Аналитика по городам
            </h2>

            <div className="mt-6 overflow-auto border border-zinc-800 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-black text-zinc-400">
                  <tr>
                    <th className="p-4 text-left">Город</th>
                    <th className="p-4 text-center">Всего КП</th>
                    <th className="p-4 text-center">Реализовано</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.cityAnalytics.map((city: any) => (
                    <tr key={city.name} className="border-b border-zinc-800">
                      <td className="p-4 font-bold">{city.name}</td>
                      <td className="p-4 text-center">{city.count}</td>
                      <td className="p-4 text-center text-lime-400 font-bold">
                        {city.implemented}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
    
  );
}