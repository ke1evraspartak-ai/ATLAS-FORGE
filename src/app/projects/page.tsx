export default function ProjectsPage() {
  const projects = [
    {
      name: "IRON GYM",
      city: "Москва",
      description: "Оснащение коммерческого фитнес-клуба",
    },
    {
      name: "POWER HOUSE",
      city: "Санкт-Петербург",
      description: "Поставка силового оборудования",
    },
    {
      name: "PRIVATE GYM",
      city: "Казань",
      description: "Домашний тренажерный зал премиум-класса",
    },
  ];

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">

        <span className="text-orange-500 uppercase tracking-[6px]">
          Atlas Forge
        </span>

        <h1 className="text-6xl md:text-7xl font-black mt-4">
          Наши проекты
        </h1>

        <p className="text-zinc-400 text-xl mt-6 max-w-3xl">
          Оснащаем коммерческие фитнес-клубы,
          спортивные центры и частные залы.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          {projects.map((project) => (
            <div
              key={project.name}
              className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-orange-500/40 transition"
            >
              <div className="h-64 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                <span className="text-zinc-500">
                  Фото проекта
                </span>
              </div>

              <div className="p-8">
                <div className="text-orange-500 uppercase text-xs tracking-widest">
                  {project.city}
                </div>

                <h2 className="text-3xl font-bold mt-4">
                  {project.name}
                </h2>

                <p className="text-zinc-400 mt-4">
                  {project.description}
                </p>
              </div>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}