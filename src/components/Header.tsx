export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur">

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        <div className="text-2xl font-black text-white">
          ATLAS FORGE
        </div>

        <nav className="hidden md:flex gap-8 text-sm uppercase text-white">

          <a href="/">Главная</a>
          <a href="#">Каталог</a>
          <a href="#">Проекты</a>
          <a href="#">Дилерам</a>
          <a href="#">Контакты</a>

        </nav>

      </div>

    </header>
  );
}