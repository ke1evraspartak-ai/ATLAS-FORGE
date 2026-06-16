"use client";

export default function AdminHeader() {
  return (
    <div className="flex justify-end mb-6">
      <button
        onClick={() => {
          localStorage.removeItem("atlas_admin");
          document.cookie = "atlas_admin_id=; path=/; max-age=0";
          window.location.href = "/admin-login";
        }}
        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-5 py-3 font-bold"
      >
        Выйти из админки
      </button>
    </div>
  );
}