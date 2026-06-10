"use client";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="text-zinc-400 hover:text-white transition"
    >
      ← Назад
    </button>
  );
}