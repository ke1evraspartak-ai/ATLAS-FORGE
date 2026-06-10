"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ManagerLoginPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loadManagers = async () => {
      const { data } = await supabase
        .from("managers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      setManagers(data || []);
    };

    loadManagers();
  }, []);

  const login = () => {
    const manager = managers.find((item) => item.id === managerId);

    if (!manager) {
      alert("Выберите менеджера");
      return;
    }

    if (manager.password !== password) {
      alert("Неверный пароль");
      return;
    }

    localStorage.setItem("atlas_manager", JSON.stringify(manager));
    document.cookie = `atlas_manager_id=${manager.id}; path=/; max-age=604800`;

    window.location.href = "/manager";
  };

  return (
    <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="text-orange-500 uppercase tracking-[6px] text-sm">
          ATLAS FORGE
        </div>

        <h1 className="text-4xl font-black mt-4">Вход менеджера</h1>

        <div className="space-y-4 mt-8">
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-4"
          >
            <option value="">Выберите менеджера</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-black border border-zinc-700 rounded-xl p-4"
          />

          <button
            onClick={login}
            className="w-full bg-orange-500 hover:bg-orange-600 transition rounded-xl px-6 py-4 font-bold"
          >
            Войти
          </button>
        </div>
      </div>
    </main>
  );
}