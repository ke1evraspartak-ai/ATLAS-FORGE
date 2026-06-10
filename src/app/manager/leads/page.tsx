"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const statusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "work", label: "В работе" },
  { value: "sent", label: "КП отправлено" },
  { value: "implemented", label: "Реализовано" },
  { value: "closed", label: "Закрыто" },
  { value: "draft", label: "Черновик" },
];

const managerFilterOptions = [
  { value: "mine", label: "Мои + без менеджера" },
  { value: "unassigned", label: "Без менеджера" },
  { value: "all", label: "Все заявки" },
];

const getStatusClassName = (status: string) => {
  if (status === "new") return "bg-zinc-700 text-white border-zinc-500";
  if (status === "work") return "bg-blue-600 text-white border-blue-400";
  if (status === "sent") return "bg-orange-500 text-white border-orange-300";
  if (status === "closed") return "bg-red-600 text-white border-red-400";
  if (status === "implemented") return "bg-lime-500 text-black border-lime-300";
  return "bg-black text-white border-zinc-700";
};

export default function ManagerLeadsPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [currentManager, setCurrentManager] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("mine");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedManager = localStorage.getItem("atlas_manager");

    if (savedManager) {
      try {
        setCurrentManager(JSON.parse(savedManager));
      } catch {
        setCurrentManager(null);
      }
    }
  }, []);

  const createTasksForNewCartLeads = async (
    offersData: any[],
    tasksData: any[],
  ) => {
    const today = new Date().toISOString().slice(0, 10);

    const newCartLeads = offersData.filter(
      (offer) =>
        offer.source === "cart" &&
        (offer.status === "new" || !offer.status) &&
        offer.client_id,
    );

    const tasksToCreate = newCartLeads
      .map((offer) => ({
        offer,
        title: `Связаться по заявке с сайта ${offer.offer_number || ""}`.trim(),
      }))
      .filter(({ offer, title }) => {
        return !tasksData.some(
          (task) =>
            task.client_id === offer.client_id &&
            task.title === title &&
            task.status !== "done",
        );
      });

    if (tasksToCreate.length === 0) return;

    const { error } = await supabase.from("client_tasks").insert(
      tasksToCreate.map(({ offer, title }) => ({
        client_id: offer.client_id,
        title,
        due_date: today,
        status: "contact",
      })),
    );

    if (error) {
      console.error(error.message);
      return;
    }

    await Promise.all(
      tasksToCreate.map(({ offer, title }) =>
        supabase.from("client_history").insert({
          client_id: offer.client_id,
          event_type: "task",
          description: `Автоматически создана задача по заявке из корзины: ${title}`,
        }),
      ),
    );
  };

  const loadData = async () => {
    const { data: offersData } = await supabase
      .from("commercial_offers")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: tasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    const { data: managersData } = await supabase
      .from("managers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    await createTasksForNewCartLeads(offersData || [], tasksData || []);

    const { data: freshTasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    setOffers(offersData || []);
    setTasks(freshTasksData || tasksData || []);
    setManagers(managersData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const newCartLeadsCount = offers.filter(
    (offer) =>
      offer.source === "cart" && (offer.status === "new" || !offer.status),
  ).length;

  const openTasksCount = tasks.filter((task) => task.status !== "done").length;

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const q = search.toLowerCase().trim();

      const matchStatus =
        statusFilter === "all" ? true : offer.status === statusFilter;

      const matchSearch = q
        ? offer.client_name?.toLowerCase().includes(q) ||
          offer.client_phone?.toLowerCase().includes(q) ||
          offer.city?.toLowerCase().includes(q) ||
          offer.offer_number?.toLowerCase().includes(q)
        : true;

      let matchManager = true;

      if (managerFilter === "mine") {
        matchManager =
          !currentManager?.id ||
          offer.manager_id === currentManager.id ||
          !offer.manager_id;
      } else if (managerFilter === "unassigned") {
        matchManager = !offer.manager_id;
      } else if (managerFilter === "all") {
        matchManager = true;
      } else {
        matchManager = offer.manager_id === managerFilter;
      }

      return matchStatus && matchSearch && matchManager;
    });
  }, [offers, search, statusFilter, managerFilter, currentManager]);

  const getManagerName = (managerId: string) => {
    if (!managerId) return "Без менеджера";
    return managers.find((manager) => manager.id === managerId)?.name || "Менеджер";
  };

  const getSourceLabel = (source: string) => {
    if (source === "cart") return "Корзина";
    if (source === "crm") return "CRM";
    return "Менеджер";
  };

  const updateOfferStatus = async (offer: any, status: string) => {
    const payload: any = {
      status,
    };

    // Если заявка ещё не закреплена ни за кем, первый менеджер,
    // который взял её в работу/отправил КП/закрыл, автоматически становится ответственным.
    if (!offer.manager_id && currentManager?.id && status !== "new" && status !== "draft") {
      payload.manager_id = currentManager.id;
    }

    const { error } = await supabase
      .from("commercial_offers")
      .update(payload)
      .eq("id", offer.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const updateOfferManager = async (offerId: string, managerId: string) => {
    const { error } = await supabase
      .from("commercial_offers")
      .update({ manager_id: managerId || null })
      .eq("id", offerId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Удалить заявку? Это действие нельзя отменить.")) return;

    const { error } = await supabase
      .from("commercial_offers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const openOffer = (id: string) => {
    localStorage.setItem("openOfferId", id);
    localStorage.setItem("managerOpenOfferId", id);
    window.location.href = `/manager?offerId=${id}`;
  };

  const openClient = (clientId: string) => {
    localStorage.setItem("openClientId", clientId);
    window.location.href = `/manager/clients?clientId=${clientId}`;
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-15">
        <div className="flex flex-wrap items-end justify-between gap-4 mt-8">
          <div>
            <h1 className="text-6xl font-black">Заявки</h1>

            {currentManager && (
              <div className="text-zinc-400 mt-3">
                Вы вошли как:{" "}
                <span className="text-orange-500 font-bold">
                  {currentManager.name}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("atlas_manager");
              document.cookie = "atlas_manager_id=; path=/; max-age=0";
              window.location.href = "/manager-login";
            }}
            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-5 py-3 font-bold"
          >
            Выйти
          </button>
        </div>

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

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Все заявки</h2>
              <div className="text-zinc-500 mt-1">
                Заявки из корзины подсвечены зелёным
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск"
                className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
              />

              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
              >
                {managerFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}

                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-auto border border-zinc-800 rounded-2xl">
            <table className="w-full text-sm min-w-[1320px]">
              <thead className="bg-black text-zinc-400">
                <tr>
                  <th className="p-4 text-left">Статус</th>
                  <th className="p-4 text-left">Клиент</th>
                  <th className="p-4 text-left">Телефон</th>
                  <th className="p-4 text-left">Город</th>
                  <th className="p-4 text-left">КП</th>
                  <th className="p-4 text-left">Источник</th>
                  <th className="p-4 text-left">Менеджер</th>
                  <th className="p-4 text-right">Действие</th>
                </tr>
              </thead>

              <tbody>
                {filteredOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className={`border-b border-zinc-800 ${
                      offer.source === "cart" ? "bg-green-500/10" : ""
                    }`}
                  >
                    <td className="p-4">
                      <select
                        value={offer.status || "draft"}
                        onChange={(e) => updateOfferStatus(offer, e.target.value)}
                        className={`rounded-lg px-3 py-2 font-bold border ${getStatusClassName(
                          offer.status || "draft",
                        )}`}
                      >
                        <option value="new">Новая</option>
                        <option value="work">В работе</option>
                        <option value="sent">КП отправлено</option>
                        <option value="implemented">Реализовано</option>
                        <option value="closed">Закрыто</option>
                        <option value="draft">Черновик</option>
                      </select>
                    </td>

                    <td className="p-4 font-bold">
                      {offer.client_name || "—"}
                    </td>

                    <td className="p-4">
                      {offer.client_phone || "—"}
                    </td>

                    <td className="p-4">
                      {offer.city || "—"}
                    </td>

                    <td className="p-4 text-orange-500 font-bold">
                      {offer.offer_number}
                    </td>

                    <td className="p-4">
                      {getSourceLabel(offer.source)}
                    </td>

                    <td className="p-4">
                      <select
                        value={offer.manager_id || ""}
                        onChange={(e) => updateOfferManager(offer.id, e.target.value)}
                        className="bg-black border border-zinc-700 rounded-lg px-3 py-2"
                      >
                        <option value="">Без менеджера</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>

                      <div className="text-zinc-500 text-xs mt-1">
                        {getManagerName(offer.manager_id)}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openOffer(offer.id)}
                          className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-5 py-2 font-bold"
                        >
                          Открыть КП
                        </button>

                        {offer.client_id && (
                          <button
                            onClick={() => openClient(offer.client_id)}
                            className="border border-zinc-700 hover:border-orange-500 transition rounded-xl px-5 py-2 font-bold"
                          >
                            Открыть клиента
                          </button>
                        )}

                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-4 py-2 font-bold"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOffers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500">
                      Заявок пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
