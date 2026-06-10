export default function HomePage() {
  return (
    <main className="bg-[#111111] text-white">

      {/* Hero */}

<section className="relative min-h-screen flex items-center overflow-hidden">

  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920')] bg-cover bg-center" />

  <div className="absolute inset-0 bg-black/75" />

  <div className="relative z-10 max-w-7xl mx-auto px-6">

    <span className="text-orange-500 uppercase tracking-[8px] font-bold">
      Atlas Forge
    </span>

    <h1 className="text-6xl md:text-8xl font-black mt-6 leading-none max-w-5xl">
      Силовое оборудование
      нового поколения
    </h1>

    <p className="text-zinc-300 text-xl mt-8 max-w-2xl">
      Производим профессиональные скамьи, стойки и
      дисконагружаемые тренажеры для коммерческих
      фитнес-клубов и домашних спортивных залов.
    </p>

    <div className="flex gap-4 mt-10 flex-wrap">

      <button className="bg-orange-500 px-8 py-4 rounded-xl font-bold">
        Смотреть каталог
      </button>

      <button className="border border-white/30 px-8 py-4 rounded-xl">
        О бренде
      </button>

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
<section className="py-32 bg-[#151515]">

  <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

    <div>

      <span className="text-orange-500 uppercase tracking-[4px]">
        О бренде
      </span>

      <h2 className="text-5xl font-black mt-4">
        Создано для серьёзных нагрузок
      </h2>

      <p className="text-zinc-400 mt-8 text-lg">
        ATLAS FORGE производит профессиональное
        силовое оборудование с акцентом на
        надёжность, биомеханику и долговечность.
      </p>

      <p className="text-zinc-400 mt-4 text-lg">
        Каждая модель проектируется для
        коммерческой эксплуатации и многолетней
        службы.
      </p>

    </div>

    <div className="bg-zinc-900 rounded-3xl h-[400px]" />

  </div>

</section>
<section className="py-32">

  <div className="max-w-7xl mx-auto px-6">

    <h2 className="text-5xl font-black mb-12">
      Хиты продаж
    </h2>

    <div className="grid md:grid-cols-3 gap-8">

      <div className="bg-zinc-900 rounded-3xl p-8">
        <h3 className="text-2xl font-bold">
          AF-B200
        </h3>

        <p className="text-zinc-400 mt-4">
          Регулируемая скамья
        </p>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-8">
        <h3 className="text-2xl font-bold">
          AF-R300
        </h3>

        <p className="text-zinc-400 mt-4">
          Силовая рама
        </p>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-8">
        <h3 className="text-2xl font-bold">
          AF-PL500
        </h3>

        <p className="text-zinc-400 mt-4">
          Hack Squat
        </p>
      </div>

    </div>

  </div>

</section>
    </main>
  );
}