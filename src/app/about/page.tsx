export default function AboutPage() {
  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-24">

        <span className="text-orange-500 uppercase tracking-[6px]">
          Atlas Forge
        </span>

        <h1 className="text-6xl font-black mt-6">
          О бренде
        </h1>

        <p className="text-zinc-400 text-xl mt-8 max-w-3xl">
          ATLAS FORGE — производитель профессионального
          силового оборудования для коммерческих фитнес-клубов,
          спортивных центров и домашних залов премиального уровня.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mt-20">

          <div className="bg-zinc-900 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold">
              Наша миссия
            </h2>

            <p className="text-zinc-400 mt-4">
              Создавать оборудование, которое выдерживает
              самые высокие нагрузки и выглядит премиально.
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold">
              Качество
            </h2>

            <p className="text-zinc-400 mt-4">
              Используем толстостенные профили,
              промышленную покраску и профессиональные материалы.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}