"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loadManagers = async () => {
    const { data, error } = await supabase
      .from("managers")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setManagers(data || []);
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const addManager = async () => {
    if (!name.trim()) {
      alert("Введите имя менеджера");
      return;
    }

    if (!password.trim()) {
      alert("Введите пароль");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("managers").insert({
      name,
      position,
      phone,
      email,
      password,
      is_active: true,
      sort_order: managers.length + 1,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPosition("");
    setPhone("");
    setEmail("");
    setPassword("");

    loadManagers();
  };

  const updateManager = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from("managers")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadManagers();
  };

  const deleteManager = async (id: string) => {
    if (!confirm("Удалить менеджера?")) return;

    const { error } = await supabase
      .from("managers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadManagers();
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="text-orange-500 uppercase tracking-[6px] text-sm">
              ATLAS FORGE CMS
            </div>
            <h1 className="text-5xl font-black mt-4">Менеджеры</h1>
          </div>

          <div className="flex flex-wrap gap-4">
  <Link
    href="/admin/products"
    className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-6 py-3 font-bold"
  >
    Товары
  </Link>

  <Link
    href="/admin/catalog"
    className="border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold"
  >
    Разделы каталога
  </Link>

  <Link
    href="/admin/managers"
    className="border border-orange-500 text-orange-500 transition rounded-xl px-6 py-3 font-bold"
  >
    Менеджеры
  </Link>
</div>
        </div>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mt-10">
          <h2 className="text-2xl font-black mb-6">Добавить менеджера</h2>

          <div className="grid md:grid-cols-5 gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Должность"
              className="bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
              className="bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-black border border-zinc-700 rounded-xl p-4"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="bg-black border border-zinc-700 rounded-xl p-4"
            />
          </div>

          <button
            onClick={addManager}
            disabled={loading}
            className="mt-5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition rounded-xl px-6 py-3 font-bold"
          >
            {loading ? "Добавляем..." : "Добавить менеджера"}
          </button>
        </section>

        <section className="mt-10 space-y-4">
          {managers.map((manager) => (
            <div
              key={manager.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 grid md:grid-cols-[1fr_1fr_1fr_1fr_120px_120px] gap-4 items-center"
            >
              <input
                value={manager.name || ""}
                onChange={(e) => updateManager(manager.id, "name", e.target.value)}
                className="bg-black border border-zinc-700 rounded-xl p-3 font-bold"
              />

              <input
                value={manager.position || ""}
                onChange={(e) => updateManager(manager.id, "position", e.target.value)}
                placeholder="Должность"
                className="bg-black border border-zinc-700 rounded-xl p-3"
              />

              <input
                value={manager.phone || ""}
                onChange={(e) => updateManager(manager.id, "phone", e.target.value)}
                placeholder="Телефон"
                className="bg-black border border-zinc-700 rounded-xl p-3"
              />

              <input
                value={manager.password || ""}
                onChange={(e) => updateManager(manager.id, "password", e.target.value)}
                placeholder="Пароль"
                className="bg-black border border-zinc-700 rounded-xl p-3"
              />

              <button
                onClick={() =>
                  updateManager(manager.id, "is_active", !manager.is_active)
                }
                className={`rounded-xl px-4 py-3 font-bold ${
                  manager.is_active
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {manager.is_active ? "Активен" : "Отключён"}
              </button>

              <button
                onClick={() => deleteManager(manager.id)}
                className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-4 py-3 font-bold"
              >
                Удалить
              </button>
            </div>
          ))}

          {managers.length === 0 && (
            <div className="text-zinc-500">Менеджеров пока нет.</div>
          )}
        </section>
      </div>
    </main>
  );
}