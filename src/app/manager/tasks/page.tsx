"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TaskGroupKey = "overdue" | "today" | "tomorrow" | "future" | "done";

const getToday = () => new Date().toISOString().slice(0, 10);

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export default function ManagerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const loadData = async () => {
    const { data: tasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    const { data: clientsData } = await supabase.from("clients").select("*");

    const { data: offersData } = await supabase
      .from("commercial_offers")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(tasksData || []);
    setClients(clientsData || []);
    setOffers(offersData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = getToday();
  const tomorrow = getTomorrow();

  const groups = useMemo(() => {
    return {
      overdue: tasks.filter(
        (task) => task.status !== "done" && task.due_date && task.due_date < today
      ),
      today: tasks.filter(
        (task) => task.status !== "done" && task.due_date === today
      ),
      tomorrow: tasks.filter(
        (task) => task.status !== "done" && task.due_date === tomorrow
      ),
      future: tasks.filter(
        (task) => task.status !== "done" && task.due_date && task.due_date > tomorrow
      ),
      done: tasks.filter((task) => task.status === "done"),
    };
  }, [tasks, today, tomorrow]);

  const openTasksCount = tasks.filter((task) => task.status !== "done").length;

  const newCartLeadsCount = offers.filter(
    (offer) =>
      offer.source === "cart" && (offer.status === "new" || !offer.status)
  ).length;

  const getClient = (clientId: string) => {
    return clients.find((client) => client.id === clientId);
  };

  const updateTask = async (taskId: string, payload: any) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...payload } : task))
    );

    const { error } = await supabase
      .from("client_tasks")
      .update(payload)
      .eq("id", taskId);

    if (error) {
      alert(error.message);
      loadData();
    }
  };

  const openClient = (clientId: string) => {
    localStorage.setItem("openClientId", clientId);
    window.location.href = `/manager/clients?clientId=${clientId}`;
  };

  const moveTaskToGroup = async (group: TaskGroupKey) => {
    if (!dragTaskId) return;

    if (group === "today") {
      await updateTask(dragTaskId, { due_date: today, status: "open" });
    }

    if (group === "tomorrow") {
      await updateTask(dragTaskId, { due_date: tomorrow, status: "open" });
    }

    if (group === "future") {
      const date = new Date();
      date.setDate(date.getDate() + 7);

      await updateTask(dragTaskId, {
        due_date: date.toISOString().slice(0, 10),
        status: "open",
      });
    }

    if (group === "done") {
      await updateTask(dragTaskId, { status: "done" });
    }

    if (group === "overdue") {
      await updateTask(dragTaskId, { due_date: today, status: "open" });
    }

    setDragTaskId(null);
  };

  const renderColumn = (
    key: TaskGroupKey,
    title: string,
    list: any[],
    color: string
  ) => {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => moveTaskToGroup(key)}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden min-w-[250px]"
      >
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{title}</h2>

            <div className="bg-black border border-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400">
              {list.length}
            </div>
          </div>
        </div>

        <div className="p-3 space-y-3 min-h-[680px]">
          {list.map((task) => {
            const client = getClient(task.client_id);

            return (
              <div
                key={task.id}
                draggable
                onDragStart={() => setDragTaskId(task.id)}
                onDragEnd={() => setDragTaskId(null)}
                onClick={() => openClient(task.client_id)}
                className={`cursor-pointer active:cursor-grabbing border rounded-2xl p-3 transition hover:scale-[1.01] ${color}`}
              >
                <div className="font-black text-base leading-tight line-clamp-1">
                  {client?.name || "Клиент"}
                </div>

                <div className="text-zinc-400 text-xs mt-1 line-clamp-1">
                  {client?.city || "Город не указан"}
                </div>

                <div className="text-zinc-300 text-xs mt-2 line-clamp-2">
                  {task.title}
                </div>
              </div>
            );
          })}

          {list.length === 0 && (
            <div className="text-zinc-500 text-sm p-4 border border-dashed border-zinc-800 rounded-2xl">
              Перетащите задачу сюда.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-15">
        <h1 className="text-6xl font-black mt-8">Задачи</h1>

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

        <div className="flex flex-wrap items-center gap-4 mt-8">
          <div className="text-zinc-500 mt-14">
            Зажмите карточку задачи и перетащите её в нужный столбец.
          </div>
        </div>

        <div className="mt-12 overflow-x-auto pb-4">
          <div className="grid grid-cols-5 gap-5 min-w-[1300px] items-start">
            {renderColumn(
              "overdue",
              "Просроченные",
              groups.overdue,
              "border-red-500 bg-red-500/10"
            )}

            {renderColumn(
              "today",
              "Сегодня",
              groups.today,
              "border-orange-500 bg-orange-500/10"
            )}

            {renderColumn(
              "tomorrow",
              "Завтра",
              groups.tomorrow,
              "border-blue-500 bg-blue-500/10"
            )}

            {renderColumn(
              "future",
              "Будущие",
              groups.future,
              "border-zinc-700 bg-black"
            )}

            {renderColumn(
              "done",
              "Выполненные",
              groups.done,
              "border-lime-500 bg-lime-500/10"
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
