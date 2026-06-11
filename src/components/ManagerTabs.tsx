"use client";

import Link from "next/link";

type Props = {
  active?: "kp" | "clients" | "tasks" | "leads" | "analytics";
  tasksCount?: number;
  leadsCount?: number;
};

export default function ManagerTabs({
  active,
  tasksCount = 0,
  leadsCount = 0,
}: Props) {
  const baseClass =
    "relative bg-zinc-900 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-3 font-bold";

  const activeClass =
    "bg-orange-500 hover:bg-orange-600 border-orange-500 text-white";

  return (
    <div className="flex flex-wrap items-center gap-4 mt-8">
      <Link
        href="/manager"
        className={`${baseClass} ${
          active === "kp" ? activeClass : ""
        }`}
      >
        Конструктор КП
      </Link>

      <Link
        href="/manager/clients"
        className={`${baseClass} ${
          active === "clients" ? activeClass : ""
        }`}
      >
        Клиенты CRM
      </Link>

      <Link
        href="/manager/tasks"
        className={`${baseClass} ${
          active === "tasks" ? activeClass : ""
        }`}
      >
        Задачи

        {tasksCount > 0 && (
          <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center">
            {tasksCount}
          </span>
        )}
      </Link>

      <Link
        href="/manager/leads"
        className={`${baseClass} ${
          active === "leads" ? activeClass : ""
        }`}
      >
        Заявки

        {leadsCount > 0 && (
          <span className="absolute -top-3 -right-3 bg-green-500 text-black text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center font-black">
            {leadsCount}
          </span>
        )}
      </Link>

      <Link
        href="/manager/analytics"
        className={`${baseClass} ${
          active === "analytics" ? activeClass : ""
        }`}
      >
        Аналитика
      </Link>
    </div>
  );
}