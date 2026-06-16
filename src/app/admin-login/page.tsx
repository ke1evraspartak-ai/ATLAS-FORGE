"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!login.trim() || !password.trim()) {
      alert("Введите логин и пароль");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("login", login.trim())
      .eq("password", password.trim())
      .eq("is_active", true)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Неверный логин или пароль");
      return;
    }

    localStorage.setItem("atlas_admin", JSON.stringify(data));
    document.cookie = `atlas_admin_id=${data.id}; path=/; max-age=31536000`;

    window.location.href = "/admin/products";
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-black text-white mb-8">
          Вход в админку
        </h1>

        <div className="space-y-4">
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Логин"
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
          />

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-3 disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </div>
      </div>
    </main>
  );
}