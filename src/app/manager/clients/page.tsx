"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ManagerTabs from "@/components/ManagerTabs";
import ManagerHeader from "@/components/ManagerHeader";


const CLIENT_STATUSES = [
  { value: "new", label: "Новый" },
  { value: "work", label: "В работе" },
  { value: "sent", label: "КП отправлено" },
  { value: "implemented", label: "Реализовано" },
  { value: "closed", label: "Закрыто" },
];

const TASK_STATUSES = [
  { value: "contact", label: "Связаться" },
  { value: "quote", label: "Сделать КП" },
  { value: "meeting", label: "Встреча" },
  { value: "done", label: "Выполнено" },
];

const normalizePhoneForLink = (phone: string) => {
  return String(phone || "").replace(/\D/g, "");
};

const getRussianPhone = (phone: string) => {
  const clean = normalizePhoneForLink(phone);
  if (!clean) return "";
  return clean.startsWith("8") ? `7${clean.slice(1)}` : clean;
};

const getWhatsAppLink = (phone: string) => {
  const clean = getRussianPhone(phone);
  return clean ? `https://wa.me/${clean}` : "";
};

const getTelegramLink = (phone: string) => {
  const clean = getRussianPhone(phone);
  return clean ? `https://t.me/+${clean}` : "";
};

export default function ManagerClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [search, setSearch] = useState("");
const [clientView, setClientView] = useState("mine");
const [currentManager, setCurrentManager] = useState<any>(null);
const [newComment, setNewComment] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const taskDateRef = useRef<HTMLInputElement>(null);

  const [editingComments, setEditingComments] = useState<Record<string, string>>({});
  const [editingTasks, setEditingTasks] = useState<Record<string, any>>({});

  const loadData = async () => {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: offersData } = await supabase
      .from("commercial_offers")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: commentsData } = await supabase
      .from("client_comments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: tasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    const { data: historyData } = await supabase
      .from("client_history")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: managersData } = await supabase
      .from("managers")
      .select("*")
      .order("sort_order");

    setClients(clientsData || []);
    setOffers(offersData || []);
    setComments(commentsData || []);
    setTasks(tasksData || []);
    setHistory(historyData || []);
    setManagers(managersData || []);

    if (selectedClient) {
      const freshClient = (clientsData || []).find(
        (client) => client.id === selectedClient.id
      );

      if (freshClient) {
        setSelectedClient(freshClient);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
  const savedManager = localStorage.getItem("atlas_manager");

  if (!savedManager) {
    window.location.href = "/manager-login";
    return;
  }

  try {
    setCurrentManager(JSON.parse(savedManager));
  } catch {
    localStorage.removeItem("atlas_manager");
    document.cookie = "atlas_manager_id=; path=/; max-age=0";
    window.location.href = "/manager-login";
  }
}, []);

  useEffect(() => {
    if (clients.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const clientId =
      params.get("clientId") || localStorage.getItem("openClientId");

    if (!clientId) return;

    const client = clients.find((item) => item.id === clientId);

    if (client) {
      setSelectedClient(client);
      localStorage.removeItem("openClientId");
    }
  }, [clients]);

  const filteredClients = useMemo(() => {
  const q = search.toLowerCase();

  return clients.filter((client) => {
    const matchesSearch =
      !q ||
      client.name?.toLowerCase().includes(q) ||
      client.phone?.toLowerCase().includes(q) ||
      client.city?.toLowerCase().includes(q) ||
      client.object_name?.toLowerCase().includes(q);

    const matchesManager =
      clientView === "all"
        ? true
        : clientView === "unassigned"
          ? !client.manager_id
          : clientView === "mine"
            ? client.manager_id === currentManager?.id || !client.manager_id
            : client.manager_id === clientView;

    return matchesSearch && matchesManager;
  });
}, [clients, search, clientView, currentManager]);

  const clientOffers = offers.filter(
    (offer) => offer.client_id === selectedClient?.id
  );

  const clientComments = comments.filter(
    (comment) => comment.client_id === selectedClient?.id
  );

  const clientTasks = tasks.filter(
    (task) => task.client_id === selectedClient?.id
  );

  const clientHistory = history.filter(
    (item) => item.client_id === selectedClient?.id
  );

  const addHistory = async (
    clientId: string,
    eventType: string,
    description: string,
  ) => {
    await supabase.from("client_history").insert({
      client_id: clientId,
      event_type: eventType,
      description,
    });
  };

  const updateClient = async (field: string, value: string) => {
    if (!selectedClient) return;

    const updatedClient = {
      ...selectedClient,
      [field]: value,
    };

    setSelectedClient(updatedClient);

    setClients((prev) =>
      prev.map((client) =>
        client.id === selectedClient.id ? updatedClient : client
      )
    );

    const { error } = await supabase
      .from("clients")
      .update({ [field]: value })
      .eq("id", selectedClient.id);

    if (error) {
      alert(error.message);
      loadData();
      return;
    }

    if (field === "status" && selectedClient.status !== value) {
      const oldStatus =
        CLIENT_STATUSES.find((status) => status.value === selectedClient.status)?.label ||
        selectedClient.status ||
        "Без статуса";

      const newStatus =
        CLIENT_STATUSES.find((status) => status.value === value)?.label ||
        value;

      await addHistory(
        selectedClient.id,
        "status",
        `Статус клиента изменён: ${oldStatus} → ${newStatus}`,
      );
    }

    const offerSyncPayload: any = {};

    if (field === "name") offerSyncPayload.client_name = value;
    if (field === "phone") offerSyncPayload.client_phone = value;
    if (field === "city") offerSyncPayload.city = value;
    if (field === "object_name") offerSyncPayload.object_name = value;

    if (Object.keys(offerSyncPayload).length > 0) {
      await supabase
        .from("commercial_offers")
        .update(offerSyncPayload)
        .eq("client_id", selectedClient.id);

      setOffers((prev) =>
        prev.map((offer) =>
          offer.client_id === selectedClient.id
            ? { ...offer, ...offerSyncPayload }
            : offer
        )
      );
    }
  };

  const addComment = async () => {
    if (!selectedClient || !newComment.trim()) return;

    const { error } = await supabase.from("client_comments").insert({
      client_id: selectedClient.id,
      comment: newComment,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await addHistory(
      selectedClient.id,
      "comment",
      `Добавлен комментарий: ${newComment}`,
    );

    setNewComment("");
    loadData();
  };

  const addTask = async () => {
    if (!selectedClient || !taskTitle.trim()) return;

    const { error } = await supabase.from("client_tasks").insert({
  client_id: selectedClient.id,
  title: taskTitle,
  description: taskDescription,
  due_date: taskDate || null,
  status: "contact",
  manager_id: selectedClient.manager_id || currentManager?.id || null,
});

    if (error) {
      alert(error.message);
      return;
    }

    await addHistory(
      selectedClient.id,
      "task",
      `Создана задача: ${taskTitle}`,
    );

    setTaskTitle("");
    setTaskDescription("");
    setTaskDate("");
    loadData();
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const { error } = await supabase
      .from("client_tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const updateComment = async (commentId: string) => {
    const comment = editingComments[commentId];

    if (!comment?.trim()) return;

    const { error } = await supabase
      .from("client_comments")
      .update({ comment })
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Удалить комментарий?")) return;

    const { error } = await supabase
      .from("client_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const updateTask = async (taskId: string) => {
    const task = editingTasks[taskId];

    if (!task?.title?.trim()) return;

    const { error } = await supabase
      .from("client_tasks")
      .update({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date || null,
        status: task.status || "contact",
      })
      .eq("id", taskId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Удалить задачу?")) return;

    const { error } = await supabase
      .from("client_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  };

  const getTaskColor = (task: any) => {
    if (task.status === "done") {
      return "border-lime-500 bg-lime-500/15 shadow-[0_0_24px_rgba(132,204,22,0.12)]";
    }

    if (task.status === "quote") {
      return "border-orange-500 bg-orange-500/15 shadow-[0_0_24px_rgba(249,115,22,0.10)]";
    }

    if (task.status === "meeting") {
      return "border-purple-500 bg-purple-500/15 shadow-[0_0_24px_rgba(168,85,247,0.10)]";
    }

    return "border-blue-500 bg-blue-500/15 shadow-[0_0_24px_rgba(59,130,246,0.10)]";
  };

  const getTaskStatusClassName = (status: string) => {
    if (status === "done") return "bg-lime-500 text-black border-lime-300";
    if (status === "quote") return "bg-orange-500 text-white border-orange-300";
    if (status === "meeting") return "bg-purple-600 text-white border-purple-400";
    return "bg-blue-600 text-white border-blue-400";
  };

  const getClientStatusColor = (status: string) => {
    if (status === "new") return "bg-zinc-700 text-white border-zinc-500";
    if (status === "work") return "bg-blue-600 text-white border-blue-400";
    if (status === "sent") return "bg-orange-500 text-white border-orange-300";
    if (status === "implemented") return "bg-lime-500 text-black border-lime-300";
    if (status === "closed") return "bg-red-600 text-white border-red-400";
    return "bg-black text-white border-zinc-700";
  };

  const openOffer = (offerId: string) => {
    localStorage.setItem("openOfferId", offerId);
    localStorage.setItem("managerOpenOfferId", offerId);
    window.location.href = `/manager?offerId=${offerId}`;
  };

  const today = new Date().toISOString().slice(0, 10);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const taskGroups = {
    overdue: clientTasks.filter(
      (task) => task.status !== "done" && task.due_date && task.due_date < today
    ),
    today: clientTasks.filter(
      (task) => task.status !== "done" && task.due_date === today
    ),
    tomorrow: clientTasks.filter(
      (task) => task.status !== "done" && task.due_date === tomorrow
    ),
    future: clientTasks.filter(
      (task) => task.status !== "done" && task.due_date && task.due_date > tomorrow
    ),
    noDate: clientTasks.filter(
      (task) => task.status !== "done" && !task.due_date
    ),
    done: clientTasks.filter((task) => task.status === "done"),
  };

  const renderTasks = (title: string, list: any[]) => {
    if (list.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="text-zinc-500 text-xs uppercase tracking-widest">
          {title}
        </div>

        {list.map((task) => {
          const editedTask = editingTasks[task.id] || {
            title: task.title || "",
            description: task.description || "",
            due_date: task.due_date || "",
            status: task.status || "contact",
          };

          return (
            <div
              key={task.id}
              className={`border rounded-2xl p-4 ${getTaskColor(task)}`}
            >
              <div className="grid md:grid-cols-[1fr_170px] gap-3">
                <div className="space-y-3">
                  <input
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditingTasks((prev) => ({
                        ...prev,
                        [task.id]: {
                          ...editedTask,
                          title: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-black/70 border border-zinc-700 rounded-xl p-3 text-sm font-bold"
                    placeholder="Название задачи"
                  />

                  <textarea
                    value={editedTask.description}
                    onChange={(e) =>
                      setEditingTasks((prev) => ({
                        ...prev,
                        [task.id]: {
                          ...editedTask,
                          description: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-black/70 border border-zinc-700 rounded-xl p-3 text-sm min-h-16"
                    placeholder="Описание"
                  />

                  <input
                    type="date"
                    value={editedTask.due_date || ""}
                    onChange={(e) =>
                      setEditingTasks((prev) => ({
                        ...prev,
                        [task.id]: {
                          ...editedTask,
                          due_date: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-black/70 border border-zinc-700 rounded-xl p-3 text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <select
                    value={editedTask.status}
                    onChange={(e) =>
                      setEditingTasks((prev) => ({
                        ...prev,
                        [task.id]: {
                          ...editedTask,
                          status: e.target.value,
                        },
                      }))
                    }
                    className={`w-full rounded-xl px-3 py-3 border font-bold text-sm ${getTaskStatusClassName(
                      editedTask.status,
                    )}`}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => updateTask(task.id)}
                    className="w-full bg-orange-500 hover:bg-orange-600 transition rounded-xl px-4 py-3 font-bold text-sm"
                  >
                    Сохранить
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="w-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-4 py-3 font-bold text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const visibleClientsForCounter = clients.filter((client) => {
  if (clientView === "all") return true;
  if (clientView === "unassigned") return !client.manager_id;

  if (clientView === "mine") {
    return (
      !currentManager?.id ||
      client.manager_id === currentManager.id ||
      !client.manager_id
    );
  }

  return client.manager_id === clientView;
});

const visibleClientIds = visibleClientsForCounter.map((client) => client.id);

const openTasksCount = tasks.filter((task) => {
  const matchesClient = visibleClientIds.includes(task.client_id);
  return matchesClient && task.status !== "done";
}).length;

const newCartLeadsCount = offers.filter((offer) => {
  const matchesClient = visibleClientIds.includes(offer.client_id);

  return (
    matchesClient &&
    offer.source === "cart" &&
    (offer.status === "new" || !offer.status)
  );
}).length;

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-15">
  <ManagerHeader title="Клиенты" currentManager={currentManager} />

  <ManagerTabs
    active="clients"
    tasksCount={openTasksCount}
    leadsCount={newCartLeadsCount}
  />

        <div className="grid xl:grid-cols-[340px_1fr] gap-8 mt-12 items-start">
          <aside className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 space-y-3">
  <select
    value={clientView}
    onChange={(e) => setClientView(e.target.value)}
    className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm"
  >
    <option value="mine">Мои + без менеджера</option>
    <option value="unassigned">Без менеджера</option>
    <option value="all">Все клиенты</option>

    {managers.map((manager) => (
      <option key={manager.id} value={manager.id}>
        {manager.name}
      </option>
    ))}
  </select>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Поиск клиента"
    className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm"
  />
</div>

            <div className="max-h-[75vh] overflow-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`w-full text-left p-3 border-b border-zinc-800 transition ${
                    selectedClient?.id === client.id
                      ? "bg-orange-500/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="font-black text-base">
                    {client.name}
                  </div>

                  <div className="text-zinc-400 mt-1 text-sm">
                    {client.phone || "Без телефона"}
                  </div>

                  <div className="text-zinc-500 mt-1 text-sm">
                    {client.city || "Без города"}
                  </div>

                  <div className="text-zinc-600 mt-1 text-xs">
                    {client.object_name || "Без объекта"}
                  </div>

                  <div className="text-zinc-500 mt-1 text-xs">
  Менеджер:{" "}
  {managers.find((manager) => manager.id === client.manager_id)?.name ||
    "Без менеджера"}
</div>

                  <div
                    className={`inline-flex mt-2 rounded-lg px-3 py-1 text-xs font-bold border ${getClientStatusColor(
                      client.status || "new"
                    )}`}
                  >
                    {CLIENT_STATUSES.find((status) => status.value === (client.status || "new"))?.label || "Новый"}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section>
            {!selectedClient ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-zinc-500">
                Выберите клиента
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="grid xl:grid-cols-[1fr_320px] gap-8">
                    <div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          value={selectedClient.name || ""}
                          onChange={(e) => updateClient("name", e.target.value)}
                          placeholder="Имя клиента"
                          className="bg-black border border-zinc-700 rounded-xl p-4 text-2xl font-black"
                        />

                        <input
                          value={selectedClient.phone || ""}
                          onChange={(e) => updateClient("phone", e.target.value)}
                          placeholder="Телефон"
                          className="bg-black border border-zinc-700 rounded-xl p-4"
                        />

                        <input
                          value={selectedClient.city || ""}
                          onChange={(e) => updateClient("city", e.target.value)}
                          placeholder="Город"
                          className="bg-black border border-zinc-700 rounded-xl p-4"
                        />

                        <input
                          value={selectedClient.object_name || ""}
                          onChange={(e) =>
                            updateClient("object_name", e.target.value)
                          }
                          placeholder="Объект / адрес"
                          className="bg-black border border-zinc-700 rounded-xl p-4"
                        />

                        {selectedClient.phone && (
                          <div className="md:col-span-2 flex flex-wrap gap-3">
                            <a
                              href={`tel:${selectedClient.phone}`}
                              className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-5 py-3 font-bold"
                            >
                              Позвонить
                            </a>

                            <a
                              href={getWhatsAppLink(selectedClient.phone)}
                              target="_blank"
                              className="bg-green-600 hover:bg-green-700 transition rounded-xl px-5 py-3 font-bold"
                            >
                              WhatsApp
                            </a>

                            <a
                              href={getTelegramLink(selectedClient.phone)}
                              target="_blank"
                              className="bg-blue-600 hover:bg-blue-700 transition rounded-xl px-5 py-3 font-bold"
                            >
                              Telegram
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-black border border-zinc-800 rounded-2xl p-5">
                      <div className="text-zinc-500 text-sm">
                        Статус клиента
                      </div>
                      <div className="mt-5">
  <div className="text-zinc-500 text-sm mb-3">
    Ответственный менеджер
  </div>

  <select
    value={selectedClient.manager_id || ""}
    onChange={(e) => updateClient("manager_id", e.target.value)}
    className="w-full bg-black border border-zinc-700 rounded-xl p-4"
  >
    <option value="">Без менеджера</option>

    {managers.map((manager) => (
      <option key={manager.id} value={manager.id}>
        {manager.name}
      </option>
    ))}
  </select>
</div>

                      <select
                        value={selectedClient.status || "new"}
                        onChange={(e) => updateClient("status", e.target.value)}
                        className={`w-full mt-3 rounded-xl p-4 font-black border ${getClientStatusColor(
                          selectedClient.status || "new"
                        )}`}
                      >
                        {CLIENT_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid xl:grid-cols-2 gap-8">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h2 className="text-3xl font-black">
                      Комментарии
                    </h2>

                    <div className="mt-6 space-y-4 max-h-[500px] overflow-auto">
                      {clientComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-black border border-zinc-800 rounded-2xl p-4"
                        >
                          <textarea
                            value={editingComments[comment.id] ?? comment.comment}
                            onChange={(e) =>
                              setEditingComments((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 min-h-20"
                          />

                          <div className="flex items-center justify-between gap-4 mt-3">
                            <div className="text-zinc-500 text-xs">
                              {new Date(comment.created_at).toLocaleString(
                                "ru-RU"
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => updateComment(comment.id)}
                                className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-4 py-2 font-bold text-sm"
                              >
                                Сохранить
                              </button>

                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-4 py-2 font-bold text-sm"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Добавить комментарий"
                      className="w-full mt-6 bg-black border border-zinc-700 rounded-2xl p-4 min-h-32"
                    />

                    <button
                      onClick={addComment}
                      className="mt-4 bg-orange-500 hover:bg-orange-600 transition rounded-xl px-6 py-4 font-bold"
                    >
                      Сохранить комментарий
                    </button>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h2 className="text-3xl font-black">
                      Задачи
                    </h2>

                    <div className="space-y-6 mt-6 max-h-[520px] overflow-auto">
                      {renderTasks("Просрочено", taskGroups.overdue)}
                      {renderTasks("Сегодня", taskGroups.today)}
                      {renderTasks("Завтра", taskGroups.tomorrow)}
                      {renderTasks("Будущие", taskGroups.future)}
                      {renderTasks("Без даты", taskGroups.noDate)}
                      {renderTasks("Выполнено", taskGroups.done)}

                      {clientTasks.length === 0 && (
                        <div className="text-zinc-500">
                          Задач пока нет.
                        </div>
                      )}
                    </div>

                    <div className="mt-8 space-y-4">
                      <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Название задачи"
                        className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm"
                      />

                      <textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Описание"
                        className="w-full bg-black border border-zinc-700 rounded-xl p-3 min-h-20 text-sm"
                      />

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => taskDateRef.current?.showPicker?.()}
                          className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-left"
                        >
                          {taskDate ? `Дата задачи: ${taskDate}` : "Выбрать дату задачи"}
                        </button>

                        <input
                          ref={taskDateRef}
                          type="date"
                          value={taskDate}
                          onChange={(e) => setTaskDate(e.target.value)}
                          className="absolute left-0 top-0 w-full h-full opacity-0 pointer-events-none"
                        />
                      </div>

                      <button
                        onClick={addTask}
                        className="w-full bg-orange-500 hover:bg-orange-600 transition rounded-xl px-6 py-4 font-bold"
                      >
                        Добавить задачу
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <h2 className="text-3xl font-black">
                    История клиента
                  </h2>

                  <div className="mt-6 space-y-4 max-h-[420px] overflow-auto">
                    {clientHistory.map((event) => (
                      <div
                        key={event.id}
                        className="bg-black border border-zinc-800 rounded-2xl p-4"
                      >
                        <div className="text-zinc-300 whitespace-pre-wrap">
                          {event.description}
                        </div>

                        <div className="text-zinc-500 text-xs mt-3">
                          {new Date(event.created_at).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    ))}

                    {clientHistory.length === 0 && (
                      <div className="text-zinc-500">
                        Истории пока нет.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <h2 className="text-3xl font-black">
                    Коммерческие предложения
                  </h2>

                  <div className="mt-6 overflow-auto border border-zinc-800 rounded-2xl">
                    <table className="w-full">
                      <thead className="bg-black text-zinc-400">
                        <tr>
                          <th className="p-4 text-left">Номер</th>
                          <th className="p-4 text-left">Статус</th>
                          <th className="p-4 text-left">Источник</th>
                          <th className="p-4 text-left">Дата</th>
                          <th className="p-4 text-right">Действие</th>
                        </tr>
                      </thead>

                      <tbody>
                        {clientOffers.map((offer) => (
                          <tr
                            key={offer.id}
                            className="border-b border-zinc-800 hover:bg-white/5"
                          >
                            <td className="p-4 font-bold text-orange-500">
                              <button
                                onClick={() => openOffer(offer.id)}
                                className="hover:underline"
                              >
                                {offer.offer_number}
                              </button>
                            </td>

                            <td className="p-4">{offer.status}</td>

                            <td className="p-4">{offer.source}</td>

                            <td className="p-4 text-zinc-500">
                              {new Date(offer.created_at).toLocaleDateString(
                                "ru-RU"
                              )}
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => openOffer(offer.id)}
                                className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-5 py-2 font-bold"
                              >
                                Открыть КП
                              </button>
                            </td>
                          </tr>
                        ))}

                        {clientOffers.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-8 text-center text-zinc-500"
                            >
                              КП пока нет.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
