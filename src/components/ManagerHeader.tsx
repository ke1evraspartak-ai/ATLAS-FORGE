"use client";

type Props = {
  title: string;
  currentManager?: any;
};

export default function ManagerHeader({ title, currentManager }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mt-8">
      <div>
        <h1 className="text-6xl font-black">{title}</h1>

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
  );
}