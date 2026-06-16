import Image from "next/image";
import Link from "next/link";
import SiteSearch from "@/components/SiteSearch";
import CartHeaderButton from "@/components/CartHeaderButton";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070707]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0 flex items-center">
          <Image
            src="/logo-atlas-forge-new.png"
            alt="ATLAS FORGE"
            width={220}
            height={70}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        <nav className="hidden xl:flex items-center gap-7 text-xs uppercase tracking-[2px]">
          <Link href="/" className="text-zinc-300 hover:text-orange-500 transition">Главная</Link>
          <Link href="/catalog" className="text-zinc-300 hover:text-orange-500 transition">Каталог</Link>
          <Link href="/about" className="text-zinc-300 hover:text-orange-500 transition">О бренде</Link>
          <Link href="/projects" className="text-zinc-300 hover:text-orange-500 transition">Проекты</Link>
                    <Link href="/contacts" className="text-zinc-300 hover:text-orange-500 transition">Контакты</Link>
        </nav>

        <div className="hidden md:flex items-center gap-10 shrink-0">
          <div className="flex items-center gap-3">
            <SiteSearch />

            <CartHeaderButton />

            <Link
              href="/manager"
              className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white hover:border-orange-500 hover:text-orange-500 transition"
              title="Кабинет менеджера"
            >
              👤
            </Link>
          </div>

          <div className="flex items-center gap-3">
  <a
    href="https://wa.me/79999999999"
    target="_blank"
    className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 hover:border-green-500 transition bg-white/5"
  >
    <img
      src="/whatsapp.png"
      alt="WhatsApp"
      className="w-full h-full object-cover"
    />
  </a>

  <a
    href="https://t.me/atlasforge"
    target="_blank"
    className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 hover:border-sky-500 transition bg-white/5"
  >
    <img
      src="/telegram.png"
      alt="Telegram"
      className="w-full h-full object-cover"
    />
  </a>

  <a
    href="#"
    className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 hover:border-violet-500 transition bg-white/5"
  >
    <img
      src="/max.png"
      alt="MAX"
      className="w-full h-full object-cover"
    />
  </a>
</div>

          <a
            href="tel:88005554545"
            className="text-white font-bold tracking-wide hover:text-orange-500 transition whitespace-nowrap"
          >
            8 800 555-45-45
          </a>

          <Link
            href="/contacts"
            className="bg-orange-500 hover:bg-orange-600 transition px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap"
          >
            Запросить КП
          </Link>
        </div>
      </div>
    </header>
  );
}