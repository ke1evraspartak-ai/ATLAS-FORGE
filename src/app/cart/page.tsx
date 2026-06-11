"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";

const cleanNumber = (value: string) => {
  return Number(String(value || "").replace(/\D/g, ""));
};

const formatRub = (value: number) => {
  if (!value) return "0 ₽";
  return `${value.toLocaleString("ru-RU")} ₽`;
};

const normalizePhone = (value: string) => {
  return String(value || "").replace(/\D/g, "");
};

const getItemPrice = (item: any) => {
  const usd = cleanNumber(item.price_usd);
  const usdRate = cleanNumber(item.usd_rate);
  if (usd && usdRate) return usd * usdRate;

  const eur = cleanNumber(item.price_eur);
  const eurRate = cleanNumber(item.eur_rate);
  if (eur && eurRate) return eur * eurRate;

  return cleanNumber(item.price);
};

const createOfferNumber = () => {
  const date = new Date();
  return `WEB-${date.getFullYear()}-${Date.now().toString().slice(-5)}`;
};

const createPublicToken = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [city, setCity] = useState("");
  const [objectName, setObjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  const findOrCreateClient = async (assignedManagerId: string | null) => {
    const phoneClean = normalizePhone(clientPhone);

    const { data: existingClients, error: searchError } = await supabase
      .from("clients")
      .select("*")
      .eq("phone", phoneClean)
      .limit(1);

    if (searchError) {
      throw new Error(searchError.message);
    }

    if (existingClients && existingClients.length > 0) {
      const existingClient = existingClients[0];

      await supabase
        .from("clients")
        .update({
  name: clientName,
  city,
  object_name: objectName,
  manager_id: assignedManagerId,
})
        .eq("id", existingClient.id);

      return existingClient.id;
    }

    const { data: newClient, error: createError } = await supabase
      .from("clients")
      .insert({
        name: clientName,
        phone: phoneClean,
        city,
        object_name: objectName,
        status: "new",
        manager_id: assignedManagerId,
      })
      .select()
      .single();

    if (createError || !newClient) {
      throw new Error(createError?.message || "Ошибка создания клиента");
    }

    return newClient.id;
  };

  const submitRequest = async () => {
    if (!clientName.trim()) {
      alert("Введите имя");
      return;
    }

    if (!clientPhone.trim()) {
      alert("Введите телефон");
      return;
    }

    if (!city.trim()) {
      alert("Введите город");
      return;
    }

    if (items.length === 0) {
      alert("Корзина пустая");
      return;
    }

    try {
      setLoading(true);

      const offerNumber = createOfferNumber();
      const publicToken = createPublicToken();
      let assignedManagerId: string | null = null;

const { data: managers } = await supabase
  .from("managers")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true });

if (managers && managers.length > 0) {
  const { data: distribution } = await supabase
    .from("lead_distribution")
    .select("*")
    .eq("id", 1)
    .single();

  let nextIndex = 0;

  if (distribution?.last_manager_id) {
    const currentIndex = managers.findIndex(
      (m) => m.id === distribution.last_manager_id
    );

    nextIndex =
      currentIndex >= 0
        ? (currentIndex + 1) % managers.length
        : 0;
  }

  assignedManagerId = managers[nextIndex].id;

  await supabase
    .from("lead_distribution")
    .update({
      last_manager_id: assignedManagerId,
    })
    .eq("id", 1);
}
      const clientId = await findOrCreateClient(assignedManagerId);

      const { data: offer, error } = await supabase
        .from("commercial_offers")
        .insert({
          offer_number: offerNumber,
          public_token: publicToken,
          client_id: clientId,
          client_name: clientName,
          client_phone: normalizePhone(clientPhone),
          city,
          object_name: objectName,
          source: "cart",
          status: "new",
manager_id: assignedManagerId,
show_prices: true,
        })
        .select()
        .single();

      if (error || !offer) {
        alert(error?.message || "Ошибка сохранения");
        return;
      }

      const offerItems = items.map((item, index) => ({
        offer_id: offer.id,
        product_id: item.id,
        custom_name: item.name,
        quantity: item.quantity,
        retail_price: getItemPrice(item),
        custom_price: getItemPrice(item),
        discount: 0,
        delivery_time: "",
        sort_order: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from("commercial_offer_items")
        .insert(offerItems);

      if (itemsError) {
        alert(itemsError.message);
        return;
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const productsText = items
        .map((item) => {
          const price = getItemPrice(item);
          return `• ${item.name} — ${item.quantity} шт. — ${formatRub(price * item.quantity)}`;
        })
        .join("\n");

      await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text:
            `<b>Новая заявка с сайта</b>\n\n` +
            `<b>КП:</b> ${offerNumber}\n` +
            `<b>Имя:</b> ${clientName}\n` +
            `<b>Телефон:</b> ${clientPhone}\n` +
            `<b>Город:</b> ${city}\n` +
            `<b>Объект:</b> ${objectName || "—"}\n\n` +
            `<b>Товары:</b>\n${productsText}\n\n` +
            `<b>Сумма:</b> ${formatRub(total)}\n\n` +
            `<b>Открыть кабинет:</b>\n${siteUrl}/manager`,
        }),
      }).catch(() => {
        // Telegram пока не блокирует сохранение заявки
      });

      alert(
        `Заявка отправлена.\nНомер заявки: ${offerNumber}\nМенеджер свяжется с вами.`
      );

      clearCart();
      setClientName("");
      setClientPhone("");
      setCity("");
      setObjectName("");
    } catch (error: any) {
      alert(error.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <Link href="/catalog" className="text-zinc-400 hover:text-white">
          ← В каталог
        </Link>

        <h1 className="text-6xl font-black mt-8">
          Корзина
        </h1>

        {items.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-12 text-zinc-400">
            Корзина пустая.
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 mt-12 items-start">
            <div className="space-y-4">
              {items.map((item) => {
                const itemPrice = getItemPrice(item);
                const itemTotal = itemPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex gap-5 items-center"
                  >
                    <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-orange-500 text-xs uppercase tracking-widest">
                        {item.sku}
                      </div>

                      <Link
                        href={`/catalog/${item.slug || item.id}`}
                        className="text-2xl font-bold hover:text-orange-500 transition line-clamp-2"
                      >
                        {item.name}
                      </Link>

                      <div className="text-zinc-500 mt-2">
                        Цена:{" "}
                        <span className="text-white font-bold">
                          {formatRub(itemPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-xl border border-zinc-700 hover:border-orange-500 transition"
                      >
                        −
                      </button>

                      <div className="w-10 text-center font-bold">
                        {item.quantity}
                      </div>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-xl border border-zinc-700 hover:border-orange-500 transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-32 text-right font-black text-orange-500">
                      {formatRub(itemTotal)}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 border border-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-4 py-2"
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>

            <aside className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-28">
              <h2 className="text-3xl font-black">
                Заказать расчёт
              </h2>

              <div className="mt-6 space-y-4">
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ваше имя *"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                />

                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Телефон *"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                />

                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Город *"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                />

                <input
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  placeholder="Объект / адрес"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4"
                />
              </div>

              <div className="mt-8 space-y-4 text-zinc-400">
                <div className="flex justify-between">
                  <span>Позиций</span>

                  <span className="text-white font-bold">
                    {items.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Товаров</span>

                  <span className="text-white font-bold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>

                <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
                  <span>Сумма</span>

                  <span className="text-3xl text-orange-500 font-black">
                    {formatRub(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={submitRequest}
                disabled={loading}
                className="w-full mt-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition rounded-xl px-6 py-4 font-bold"
              >
                {loading ? "Отправляем..." : "Заказать расчёт"}
              </button>

              <button
                onClick={clearCart}
                className="w-full mt-4 border border-zinc-700 hover:border-red-500 hover:text-red-500 transition rounded-xl px-6 py-3"
              >
                Очистить корзину
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
