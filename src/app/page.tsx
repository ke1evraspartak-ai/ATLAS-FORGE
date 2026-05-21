export default function HomePage() {
  return (
    <main className="bg-[#111111] text-white">

      {/* Hero */}

      <section className="min-h-screen flex items-center">

        <div className="max-w-7xl mx-auto px-6 w-full">

          <div className="max-w-3xl">

            <span className="text-orange-500 uppercase tracking-[6px] font-semibold">
              Atlas Forge
            </span>

            <h1 className="text-6xl md:text-8xl font-black mt-6 leading-none">
              Профессиональное
              <br />
              силовое оборудование
            </h1>

            <p className="text-zinc-400 text-xl mt-8">
              Производство скамей, стоек и дисконагружаемых
              тренажеров для коммерческих залов и домашних
              спортивных пространств.
            </p>

            <div className="flex gap-4 mt-10 flex-wrap">

              <button className="bg-orange-500 hover:bg-orange-600 transition px-8 py-4 rounded-xl font-bold">
                Каталог
              </button>

              <button className="border border-zinc-700 hover:border-zinc-500 transition px-8 py-4 rounded-xl">
                Получить КП
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* Categories */}

      <section className="py-24 border-t border-zinc-800">

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-black mb-12">
            Категории оборудования
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-2xl font-bold">
                Скамьи
              </h3>

              <p className="text-zinc-400 mt-4">
                Регулируемые и профессиональные модели.
              </p>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-2xl font-bold">
                Стойки
              </h3>

              <p className="text-zinc-400 mt-4">
                Стойки для приседаний и силовые рамы.
              </p>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-2xl font-bold">
                Дисконагружаемые
              </h3>

              <p className="text-zinc-400 mt-4">
                Профессиональные тренажеры коммерческого уровня.
              </p>
            </div>

          </div>

        </div>

      </section>
{/* Advantages */}

<section className="py-24 bg-black">

  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-4xl font-black mb-12">
      Почему выбирают ATLAS FORGE
    </h2>

    <div className="grid md:grid-cols-4 gap-8">

      <div>
        <div className="text-5xl font-black text-orange-500">
          10+
        </div>

        <p className="mt-4 text-zinc-400">
          Лет опыта в производстве
        </p>
      </div>

      <div>
        <div className="text-5xl font-black text-orange-500">
          500+
        </div>

        <p className="mt-4 text-zinc-400">
          Единиц оборудования
        </p>
      </div>

      <div>
        <div className="text-5xl font-black text-orange-500">
          1000+
        </div>

        <p className="mt-4 text-zinc-400">
          Довольных клиентов
        </p>
      </div>

      <div>
        <div className="text-5xl font-black text-orange-500">
          50+
        </div>

        <p className="mt-4 text-zinc-400">
          Оснащенных залов
        </p>
      </div>

    </div>

  </div>

</section>
    </main>
  );
}