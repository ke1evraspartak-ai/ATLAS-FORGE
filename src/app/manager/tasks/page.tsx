"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TaskGroupKey = "overdue" | "today" | "tomorrow" | "future" | "done";
type TaskView = "mine" | "unassigned" | "all" | string;

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
  const [managers, setManagers] = useState<any[]>([]);
  const [currentManager, setCurrentManager] = useState<any>(null);
  const [taskView, setTaskView] = useState<TaskView>("mine");
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

    const { data: managersData } = await supabase
      .from("managers")
      .select("*")
      .order("sort_order", { ascending: true });

    setTasks(tasksData || []);
    setClients(clientsData || []);
    setOffers(offersData || []);
    setManagers(managersData || []);
  };

  useEffect(() => {
    const savedManager = localStorage.getItem("atlas_manager");

    if (!savedManager) {
      window.location.href = "/manager-login";
      return;
    }

    try {
      const manager = JSON.parse(savedManager);
      setCurrentManager(manager);
      setTaskView("mine");
    } catch {
      localStorage.removeItem("atlas_manager");
      document.cookie = "atlas_manager_id=; path=/; max-age=0";
      window.location.href = "/manager-login";
    }

    loadData();
  }, []);

  const today = getToday();
  const tomorrow = getTomorrow();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (taskView === "all") return true;
      if (taskView === "unassigned") return !task.manager_id;

      if (taskView === "mine") {
        return (
          !currentManager?.id ||
          task.manager_id === currentManager.id ||
          !task.manager_id
        );
      }

      return task.manager_id === taskView;
    });
  }, [tasks, taskView, currentManager]);

  const groups = useMemo(() => {
    return {
      overdue: filteredTasks.filter(
        (task) => task.status !== "done" && task.due_date && task.due_date < today,
      ),
      today: filteredTasks.filter(
        (task) => task.status !== "done" && task.due_date === today,
      ),
      tomorrow: filteredTasks.filter(
        (task) => task.status !== "done" && task.due_date === tomorrow,
      ),
      future: filteredTasks.filter(
        (task) => task.status !== "done" && task.due_date && task.due_date > tomorrow,
      ),
      done: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks, today, tomorrow]);

  const openTasksCount = filteredTasks.filter((task) => task.status !== "done").length;

  const newCartLeadsCount = offers.filter(
    (offer) =>
      offer.source === "cart" && (offer.status === "new" || !offer.status),
  ).length;

  const getClient = (clientId: string) => {
    return clients.find((client) => client.id === clientId);
  };

  const getManagerName = (managerId: string) => {
    return managers.find((manager) => manager.id === managerId)?.name || "Без менеджера";
  };

  const updateTask = async (taskId: string, payload: any) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...payload } : task)),
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

  const assignTaskToManager = async (taskId: string, managerId: string) => {
    await updateTask(taskId, {
      manager_id: managerId || null,
    });
  };

  const openClient = (clientId: string) => {
    if (!clientId) return;

    localStorage.setItem("openClientId", clientId);
    window.location.href = `/manager/clients?clientId=${clientId}`;
  };

  const moveTaskToGroup = async (group: TaskGroupKey) => {
    if (!dragTaskId) return;

    const draggedTask = tasks.find((task) => task.id === dragTaskId);
    const basePayload: any = {};

    if (currentManager?.id && !draggedTask?.manager_id) {
      basePayload.manager_id = currentManager.id;
    }

    if (group === "today") {
      await updateTask(dragTaskId, { ...basePayload, due_date: today, status: "open" });
    }

    if (group === "tomorrow") {
      await updateTask(dragTaskId, { ...basePayload, due_date: tomorrow, status: "open" });
    }

    if (group === "future") {
      const date = new Date();
      date.setDate(date.getDate() + 7);

      await updateTask(dragTaskId, {
        ...basePayload,
        due_date: date.toISOString().slice(0, 10),
        status: "open",
      });
    }

    if (group === "done") {
      await updateTask(dragTaskId, { ...basePayload, status: "done" });
    }

    if (group === "overdue") {
      await updateTask(dragTaskId, { ...basePayload, due_date: today, status: "open" });
    }

    setDragTaskId(null);
  };

  const renderColumn = (
    key: TaskGroupKey,
    title: string,
    list: any[],
    color: string,
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

                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <div className="text-zinc-500 text-xs mb-1">Менеджер</div>

                  <select
                    value={task.manager_id || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => assignTaskToManager(task.id, e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Без менеджера</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>

                  {task.manager_id && (
                    <div className="text-zinc-500 text-xs mt-2">
                      Ответственный: {getManagerName(task.manager_id)}
                    </div>
                  )}
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
        <div className="flex flex-wrap items-start justify-between gap-4 mt-8">
          <div>
            <h1 className="text-6xl font-black">Задачи</h1>

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
            className="mt-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-5 py-3 font-bold"
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

        <div className="flex flex-wrap items-end gap-4 mt-8">
          <div className="flex-1 min-w-[280px]">
            <div className="text-zinc-500 mb-2">Фильтр задач</div>

            <select
              value={taskView}
              onChange={(e) => setTaskView(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-4"
            >
              <option value="mine">Мои + без менеджера</option>
              <option value="unassigned">Без менеджера</option>
              <option value="all">Все задачи</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-zinc-500">
            Зажмите карточку задачи и перетащите её в нужный столбец.
          </div>
        </div>

        <div className="mt-12 overflow-x-auto pb-4">
          <div className="grid grid-cols-5 gap-5 min-w-[1300px] items-start">
            {renderColumn(
              "overdue",
              "Просроченные",
              groups.overdue,
              "border-red-500 bg-red-500/10",
            )}

            {renderColumn(
              "today",
              "Сегодня",
              groups.today,
              "border-orange-500 bg-orange-500/10",
            )}

            {renderColumn(
              "tomorrow",
              "Завтра",
              groups.tomorrow,
              "border-blue-500 bg-blue-500/10",
            )}

            {renderColumn(
              "future",
              "Будущие",
              groups.future,
              "border-zinc-700 bg-black",
            )}

            {renderColumn(
              "done",
              "Выполненные",
              groups.done,
              "border-lime-500 bg-lime-500/10",
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
