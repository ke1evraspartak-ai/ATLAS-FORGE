"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ManagerTabs from "@/components/ManagerTabs";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import ExcelJS from "exceljs";
import ManagerHeader from "@/components/ManagerHeader";

type OfferItem = {
  id: string;
  product_id: string;
  sku: string;
  image: string;
  name: string;
  custom_name: string;
  quantity: number;
  retail_price: number;
  custom_price: number;
  discount: number;
  delivery_time: string;
  selected: boolean;
  specs: any;
  section: string;
  slug?: string;
};

const cleanNumber = (value: any) => Number(String(value || "").replace(/\D/g, ""));

const formatRub = (value: number) => {
  if (!value) return "0 ₽";
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
};

const formatNumber = (value: number) => {
  if (!value) return "";
  return Math.round(value).toLocaleString("ru-RU");
};

const getProductPrice = (product: any) => {
  const usd = cleanNumber(product.price_usd);
  const usdRate = cleanNumber(product.usd_rate);
  if (usd && usdRate) return usd * usdRate;

  const eur = cleanNumber(product.price_eur);
  const eurRate = cleanNumber(product.eur_rate);
  if (eur && eurRate) return eur * eurRate;

  return cleanNumber(product.price);
};

const createOfferNumber = () => {
  const date = new Date();
  return `KP-${date.getFullYear()}-${Date.now().toString().slice(-5)}`;
};

const normalizePhone = (value: string) => {
  return String(value || "").replace(/\D/g, "");
};

const getSiteOrigin = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "";
};

const getProductUrl = (item: OfferItem) => {
  const origin = getSiteOrigin();
  return `${origin}/catalog/${item.slug || item.product_id}`;
};

const specsToLines = (specs: any) => {
  if (!specs) return [];

  return Object.entries(specs)
    .filter(([, value]) => value && String(value) !== "0")
    .map(([key, value]) => `${key}: ${value}`);
};

const getImageExtension = (url: string) => {
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "jpeg";
  return "png";
};

const pdfMakeInstance = pdfMake as any;
const pdfFontsInstance = pdfFonts as any;
pdfMakeInstance.vfs = pdfFontsInstance?.pdfMake?.vfs || pdfFontsInstance?.vfs;


export default function ManagerPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [savedOffers, setSavedOffers] = useState<any[]>([]);
  const [savedOfferItems, setSavedOfferItems] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRequestsOnly, setShowRequestsOnly] = useState(false);

  const [currentOfferId, setCurrentOfferId] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [offerSearchCity, setOfferSearchCity] = useState("");
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
const [quickTaskDate, setQuickTaskDate] = useState("");
const [quickTaskStatus, setQuickTaskStatus] = useState("contact");

  const [sectionId, setSectionId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<OfferItem[]>([]);

  const [offerNumber, setOfferNumber] = useState(createOfferNumber());
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [city, setCity] = useState("");
  const [objectName, setObjectName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [currentManager, setCurrentManager] = useState<any>(null);
  const [clientId, setClientId] = useState("");

  const [deliveryCost, setDeliveryCost] = useState("");
  const [installationCost, setInstallationCost] = useState("");
  const [includeServices, setIncludeServices] = useState(false);
  const [showStock, setShowStock] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showSpecs, setShowSpecs] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [comment, setComment] = useState("");
  const [massDiscount, setMassDiscount] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const loadData = async () => {
    const { data: sectionsData } = await supabase
      .from("catalog_sections")
      .select("*")
      .order("sort_order");

    const { data: subcategoriesData } = await supabase
      .from("catalog_subcategories")
      .select("*")
      .order("sort_order");

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: managersData } = await supabase
      .from("managers")
      .select("*")
      .order("sort_order");

    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: offersData } = await supabase
      .from("commercial_offers")
      .select("*")
      .order("created_at", { ascending: false });
      const { data: savedOfferItemsData } = await supabase
  .from("commercial_offer_items")
  .select("*");

    const { data: tasksData } = await supabase
      .from("client_tasks")
      .select("*")
      .order("due_date", { ascending: true });

    setSections(sectionsData || []);
    setSubcategories(subcategoriesData || []);
    setProducts(productsData || []);
    setManagers(managersData || []);
    setClients(clientsData || []);
    setSavedOffers(offersData || []);
    setSavedOfferItems(savedOfferItemsData || []);
    setTasks(tasksData || []);
  };

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
  const savedManager = localStorage.getItem("atlas_manager");

  if (!savedManager) {
    window.location.href = "/manager-login";
    return;
  }

  const manager = JSON.parse(savedManager);
  setCurrentManager(manager);
  setManagerId(manager.id);
}, []);
const addQuickTask = async () => {
  if (!clientId || !quickTaskTitle.trim()) return;

  const { error } = await supabase.from("client_tasks").insert({
    client_id: clientId,
    title: quickTaskTitle,
    due_date: quickTaskDate || null,
    status: quickTaskStatus,
  });

  if (error) {
    alert(error.message);
    return;
  }

  await supabase.from("client_history").insert({
    client_id: clientId,
    event_type: "task",
    description: `Создана задача из КП: ${quickTaskTitle}`,
  });

  setQuickTaskTitle("");
  setQuickTaskDate("");
  setQuickTaskStatus("contact");

  loadData();
};
  const selectedSection = sections.find((item) => item.id === sectionId);

  const availableSubcategories = selectedSection
    ? subcategories.filter((item) => item.section_id === selectedSection.id)
    : [];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase();

      const matchesSection = selectedSection
        ? product.section === selectedSection.title
        : true;

      const matchesSubcategory = subcategory ? product.category === subcategory : true;

      const matchesSearch = q
        ? product.name?.toLowerCase().includes(q) ||
          product.sku?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q)
        : true;

      return matchesSection && matchesSubcategory && matchesSearch;
    });
  }, [products, selectedSection, subcategory, search]);

  const filteredSavedOffers = savedOffers.filter((offer) =>
    offerSearchCity
      ? String(offer.city || "").toLowerCase().includes(offerSearchCity.toLowerCase())
      : true,
  );

  const filteredClients = clients.filter((client) => {
    const q = clientSearch.toLowerCase();

    if (!q) return true;

    return (
      client.name?.toLowerCase().includes(q) ||
      client.phone?.toLowerCase().includes(q) ||
      client.city?.toLowerCase().includes(q) ||
      client.object_name?.toLowerCase().includes(q)
    );
  });

  const selectClient = (client: any) => {
    setClientId(client.id);
    setClientName(client.name || "");
    setClientPhone(client.phone || "");
    setCity(client.city || "");
    setObjectName(client.object_name || "");
    setManagerId(client.manager_id || managerId || "");
    setShowClientsModal(false);
  };

  const selectedManager = managers.find((manager) => manager.id === managerId);
    const selectedClientCrm = clients.find((client) => client.id === clientId);

  const selectedClientOffers = savedOffers.filter(
    (offer) => offer.client_id === clientId,
  );

  const selectedClientTasks = tasks.filter(
    (task) => task.client_id === clientId && task.status !== "done",
  );

  const nextClientTask = selectedClientTasks[0];

  const clientStatusText =
    selectedClientCrm?.status === "new"
      ? "Новый"
      : selectedClientCrm?.status === "work"
        ? "В работе"
        : selectedClientCrm?.status === "sent"
          ? "КП отправлено"
          : selectedClientCrm?.status === "implemented"
            ? "Реализовано"
            : selectedClientCrm?.status === "closed"
              ? "Закрыто"
              : "Не выбран";

  const filteredOffers = savedOffers.filter((offer) => {
    const matchStatus =
      statusFilter === "all" ? true : offer.status === statusFilter;

    const matchRequests =
      showRequestsOnly ? offer.source === "cart" : true;

    return matchStatus && matchRequests;
  });

  const today = new Date().toISOString().slice(0, 10);

  const dashboardTasksToday = tasks.filter(
    (task) => task.status !== "done" && task.due_date === today,
  );

  const dashboardOverdueTasks = tasks.filter(
    (task) => task.status !== "done" && task.due_date && task.due_date < today,
  );

  const dashboardOpenTasks = tasks.filter((task) => task.status !== "done");

  const newCartLeadsCount = savedOffers.filter(
    (offer) =>
      offer.source === "cart" && (offer.status === "new" || !offer.status),
  ).length;

  const dashboardRecentOffers = savedOffers.slice(0, 5);

  const dashboardRecentRequests = savedOffers
    .filter((offer) => offer.source === "cart")
    .slice(0, 5);

    const getOfferItems = (offerId: string) => {
  return savedOfferItems.filter((item) => item.offer_id === offerId);
};

const getOfferTotal = (offerId: string) => {
  return getOfferItems(offerId).reduce((sum, item) => {
    return sum + Number(item.custom_price || 0) * Number(item.quantity || 1);
  }, 0);
};

const getOfferStatusLabel = (status: string) => {
  if (status === "new") return "Новая";
  if (status === "work") return "В работе";
  if (status === "sent") return "КП отправлено";
  if (status === "implemented") return "Реализовано";
  if (status === "closed") return "Закрыто";
  if (status === "draft") return "Черновик";
  return "Без статуса";
};

const getOfferSourceLabel = (offer: any) => {
  if (offer.source === "cart") return "Корзина";
  if (offer.source === "crm") return "CRM";

  const manager = managers.find((item) => item.id === offer.manager_id);
  return manager?.name || "Менеджер";
};

const formatDate = (value: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU");
};


  const baseProductsTotal = items.reduce(
    (sum, item) => sum + item.custom_price * item.quantity,
    0,
  );

  const retailProductsTotal = items.reduce(
    (sum, item) => sum + item.retail_price * item.quantity,
    0,
  );

  const productsDiscountTotal = Math.max(retailProductsTotal - baseProductsTotal, 0);

  const servicesTotal = cleanNumber(deliveryCost) + cleanNumber(installationCost);

  const serviceSharePerItem =
    includeServices && items.length > 0 ? servicesTotal / items.length : 0;

  const totalProducts = includeServices ? baseProductsTotal + servicesTotal : baseProductsTotal;

  const total = totalProducts + (includeServices ? 0 : servicesTotal);

  const getDiscountAmount = (item: OfferItem) => {
    return Math.max(item.retail_price - item.custom_price, 0);
  };

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, OfferItem[]>>((acc, item) => {
      const sectionName = item.section || "Без раздела";
      if (!acc[sectionName]) acc[sectionName] = [];
      acc[sectionName].push(item);
      return acc;
    }, {});
  }, [items]);

  const addProduct = (product: any) => {
    const price = getProductPrice(product);

    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          sku: product.sku || "",
          image: product.images?.[0] || "",
          name: product.name || "",
          custom_name: product.name || "",
          quantity: 1,
          retail_price: price,
          custom_price: price,
          discount: 0,
          delivery_time: deliveryTime,
          selected: false,
          specs: product.specs || {},
          section: product.section || "Без раздела",
          slug: product.slug || "",
        },
      ];
    });
  };

  const updateItem = (id: string, field: keyof OfferItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const applyDiscount = () => {
    const discount = cleanNumber(massDiscount);

    setItems((prev) => {
      const hasSelected = prev.some((item) => item.selected);

      return prev.map((item) => {
        if (hasSelected && !item.selected) return item;

        return {
          ...item,
          discount,
          custom_price: Math.round(
            item.retail_price - item.retail_price * (discount / 100),
          ),
        };
      });
    });
  };

  const applyDeliveryTime = () => {
    if (!deliveryTime.trim()) return;

    setItems((prev) => {
      const hasSelected = prev.some((item) => item.selected);

      return prev.map((item) => {
        if (hasSelected && !item.selected) return item;
        return { ...item, delivery_time: deliveryTime };
      });
    });
  };

  const findOrCreateClient = async () => {
    if (clientId) {
      await supabase
        .from("clients")
        .update({
          name: clientName || "Без имени",
          phone: normalizePhone(clientPhone),
          city,
          object_name: objectName,
          manager_id: managerId || null,
        })
        .eq("id", clientId);

      return clientId;
    }

    const phone = normalizePhone(clientPhone);

    if (!phone && !clientName.trim()) {
      return null;
    }

    if (phone) {
      const { data: existingClients, error: searchError } = await supabase
        .from("clients")
        .select("*")
        .eq("phone", phone)
        .limit(1);

      if (searchError) {
        alert(searchError.message);
        return null;
      }

      if (existingClients && existingClients.length > 0) {
        const existingClient = existingClients[0];

        await supabase
          .from("clients")
          .update({
            name: clientName || existingClient.name,
            city,
            object_name: objectName,
            manager_id: managerId || null,
          })
          .eq("id", existingClient.id);

        return existingClient.id;
      }
    }

    const { data: newClient, error: createError } = await supabase
      .from("clients")
      .insert({
        name: clientName || "Без имени",
        phone,
        city,
        object_name: objectName,
        manager_id: managerId || null,
        status: "new",
      })
      .select()
      .single();

    if (createError || !newClient) {
      alert(createError?.message || "Ошибка создания клиента");
      return null;
    }

    return newClient.id;
  };

  const saveOffer = async () => {
    const clientId = await findOrCreateClient();

    const offerPayload = {
      offer_number: offerNumber,
      client_id: clientId,
      client_name: clientName,
      client_phone: clientPhone,
      city,
      object_name: objectName,
      manager_id: managerId || null,
      delivery_cost: cleanNumber(deliveryCost),
      installation_cost: cleanNumber(installationCost),
      include_services_in_products: includeServices,
      show_prices: showPrices,
      show_specs: showSpecs,
      show_stock: showStock,
      global_discount: Number(massDiscount || 0),
      delivery_time: deliveryTime,
      comment,
    };

    let offerId = currentOfferId;

    if (currentOfferId) {
      const { error } = await supabase
        .from("commercial_offers")
        .update(offerPayload)
        .eq("id", currentOfferId);

      if (error) {
        alert(error.message);
        return;
      }

      await supabase
        .from("commercial_offer_items")
        .delete()
        .eq("offer_id", currentOfferId);
    } else {
      const { data: offer, error } = await supabase
        .from("commercial_offers")
        .insert(offerPayload)
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      offerId = offer.id;
      setCurrentOfferId(offer.id);
    }

    const offerItems = items.map((item, index) => ({
      offer_id: offerId,
      product_id: item.product_id,
      custom_name: item.custom_name,
      quantity: item.quantity,
      retail_price: item.retail_price,
      custom_price: item.custom_price,
      discount: item.discount,
      delivery_time: item.delivery_time,
      sort_order: index + 1,
    }));

    if (offerItems.length > 0) {
      const { error } = await supabase.from("commercial_offer_items").insert(offerItems);

      if (error) {
        alert(error.message);
        return;
      }
    }
if (clientId) {
  const today = new Date();
  today.setDate(today.getDate() + 3);

  await supabase.from("client_tasks").insert({
  client_id: clientId,
  title: `Контроль КП ${offerNumber}`,
  due_date: today.toISOString().slice(0, 10),
  status: "offer",
  manager_id: managerId || null,
});

  await supabase.from("client_history").insert({
    client_id: clientId,
    event_type: "task",
    description: `Автоматически создана задача по КП ${offerNumber}`,
  });
}
if (clientId && managerId) {
  await supabase
    .from("clients")
    .update({ manager_id: managerId })
    .eq("id", clientId);

  await supabase
    .from("client_tasks")
    .update({ manager_id: managerId })
    .eq("client_id", clientId);
}
    alert(`КП ${offerNumber} сохранено`);
    loadData();
  };

  const createNewOffer = () => {
    setCurrentOfferId("");
    setSelectedOfferId("");
    setOfferNumber(createOfferNumber());
    setClientId("");
    setClientName("");
    setClientPhone("");
    setCity("");
    setObjectName("");
    setManagerId(currentManager?.id || "");
    setDeliveryCost("");
    setInstallationCost("");
    setIncludeServices(false);
    setShowStock(true);
    setShowPrices(true);
    setShowSpecs(false);
    setDeliveryTime("");
    setComment("");
    setMassDiscount("");
    setItems([]);
  };

  const loadOfferById = async (id: string) => {
    const { data: fullOffer } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", id)
      .single();

    const { data: offerItems } = await supabase
      .from("commercial_offer_items")
      .select("*, product:products(*)")
      .eq("offer_id", id)
      .order("sort_order");

    if (!fullOffer) {
      alert("КП не найдено");
      return;
    }

    setCurrentOfferId(fullOffer.id);
    setSelectedOfferId(fullOffer.id);
    setOfferNumber(fullOffer.offer_number || createOfferNumber());
    setClientId(fullOffer.client_id || "");
    setClientName(fullOffer.client_name || "");
    setClientPhone(fullOffer.client_phone || "");
    setCity(fullOffer.city || "");
    setObjectName(fullOffer.object_name || "");
    setManagerId(fullOffer.manager_id || "");
    setDeliveryCost(String(cleanNumber(fullOffer.delivery_cost)));
    setInstallationCost(String(cleanNumber(fullOffer.installation_cost)));
    setIncludeServices(Boolean(fullOffer.include_services_in_products));
    setShowPrices(Boolean(fullOffer.show_prices));
    setShowSpecs(Boolean(fullOffer.show_specs));
    setShowStock(Boolean(fullOffer.show_stock));
    setMassDiscount(String(cleanNumber(fullOffer.global_discount)));
    setDeliveryTime(fullOffer.delivery_time || "");
    setComment(fullOffer.comment || "");

    setItems(
      (offerItems || []).map((item: any) => {
        const product = item.product || {};

        return {
          id: item.id,
          product_id: item.product_id,
          sku: product.sku || "",
          image: product.images?.[0] || "",
          name: product.name || item.custom_name || "",
          custom_name: item.custom_name || product.name || "",
          quantity: Number(item.quantity || 1),
          retail_price: Number(item.retail_price || 0),
          custom_price: Number(item.custom_price || 0),
          discount: Number(item.discount || 0),
          delivery_time: item.delivery_time || "",
          selected: false,
          specs: product.specs || {},
          section: product.section || "Без раздела",
          slug: product.slug || "",
        };
      }),
    );

    setShowOffersModal(false);
  };

  const fetchImageDataUrl = async (url: string) => {
    if (!url) return null;

    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) return null;

      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };


  const fetchImageBuffer = async (url: string) => {
    if (!url) return null;

    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) return null;

      return await response.arrayBuffer();
    } catch {
      return null;
    }
  };

  const fetchFirstImageDataUrl = async (urls: string[]) => {
    for (const url of urls) {
      const image = await fetchImageDataUrl(url);
      if (image) return image;
    }

    return null;
  };

  const deliveryIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect x="10" y="24" width="38" height="26" rx="4" fill="#f97316"/>
      <path d="M48 32h12l8 10v8H48V32z" fill="#111111"/>
      <circle cx="24" cy="56" r="6" fill="#111111"/>
      <circle cx="58" cy="56" r="6" fill="#111111"/>
    </svg>
  `;

  const assemblyIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect x="16" y="52" width="48" height="8" rx="3" fill="#f97316"/>
      <path d="M24 44l24-24 8 8-24 24z" fill="#111111"/>
      <path d="M47 17l6-6 16 16-6 6z" fill="#f97316"/>
    </svg>
  `;
  const buildPdfImageMap = async () => {
    const entries = await Promise.all(
      items.map(async (item) => {
        const dataUrl = await fetchImageDataUrl(item.image);
        return [item.id, dataUrl] as const;
      }),
    );

    return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
  };

  const buildPdfProductRows = (sectionItems: OfferItem[], imageMap: Record<string, string>) => {
    return sectionItems.map((item) => {
      const row: any[] = [
        imageMap[item.id]
          ? { image: imageMap[item.id], fit: [60, 60], alignment: "center", margin: [0, 2, 0, 2] }
          : { text: "", margin: [0, 26, 0, 26] },
        {
          stack: [
            { text: item.custom_name, bold: true, link: getProductUrl(item), color: "#1155cc" },
            { text: `Артикул: ${item.sku}`, color: "#737373", fontSize: 7, margin: [0, 2, 0, 0] },
          ],
          margin: [0, 4, 0, 4],
        },
      ];

      if (showSpecs) {
        row.push({ text: specsToLines(item.specs).join("\n") || "—", fontSize: 7, color: "#555555" });
      }

      row.push({ text: String(item.quantity), alignment: "center" });

      if (showPrices) {
        row.push(
          { text: formatRub(item.retail_price), alignment: "right", noWrap: true },
          { text: getDiscountAmount(item) ? formatRub(getDiscountAmount(item)) : "—", alignment: "right", noWrap: true },
          { text: formatRub(item.custom_price), alignment: "right", noWrap: true },
          {
            text: formatRub(item.custom_price * item.quantity + serviceSharePerItem),
            alignment: "right",
            bold: true,
            noWrap: true,
          },
        );
      }

      if (showStock) {
        row.push({ text: item.delivery_time || deliveryTime || "—" });
      }

      return row;
    });
  };

  const getPdfWidths = () => {
    const widths: any[] = [64, showSpecs ? "*" : "*"];
    if (showSpecs) widths.push(92);
    widths.push(34);

    if (showPrices) {
      widths.push(54, 52, 56, 58);
    }

    if (showStock) widths.push(54);

    return widths;
  };

  const getPdfHeaderRow = () => {
    const row: any[] = ["Фото", "Наименование"];
    if (showSpecs) row.push("Характеристики");
    row.push("Кол-во");

    if (showPrices) {
      row.push("Цена", "Скидка", "Со скидкой", "Сумма");
    }

    if (showStock) row.push("Наличие");

    return row.map((text) => ({
      text,
      bold: true,
      color: "#ffffff",
      alignment: text === "Фото" || text === "Кол-во" ? "center" : text === "Наименование" || text === "Характеристики" || text === "Наличие" ? "left" : "right",
      margin: [0, 3, 0, 3],
    }));
  };

  const generatePdf = async (mode: "current" | "no-prices") => {
    const originalShowPrices = showPrices;

    if (mode === "no-prices") {
      setShowPrices(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setGeneratingPdf(true);

    try {
      const pricesVisible = mode === "no-prices" ? false : originalShowPrices;
      const logoDataUrl = await fetchFirstImageDataUrl([
        "/logo-atlas-forge.png",
        "/logo-atlas-forge-new.png",
      ]);
      const imageMap = await buildPdfImageMap();
      const content: any[] = [];

      content.push({
        stack: [
          logoDataUrl
            ? { image: logoDataUrl, fit: [180, 72], margin: [0, 0, 0, 75] }
            : { text: "ATLAS FORGE", fontSize: 32, bold: true, color: "#ffffff", margin: [0, 0, 0, 82] },
          { text: "Коммерческое предложение", fontSize: 36, bold: true, color: "#ffffff", lineHeight: 1.05, margin: [0, 0, 0, 16] },
          { text: offerNumber, fontSize: 16, color: "#ffffff", margin: [0, 0, 0, 24] },
          { text: `Клиент: ${clientName || "Не указан"}`, fontSize: 13, color: "#d4d4d4", margin: [0, 0, 0, 6] },
          { text: `Город: ${city || "Не указан"}`, fontSize: 12, color: "#a3a3a3", margin: [0, 0, 0, 6] },
          { text: `Объект: ${objectName || "Не указан"}`, fontSize: 12, color: "#a3a3a3" },
          {
            columns: [
              { text: `Менеджер: ${selectedManager?.name || "Не указан"}`, fontSize: 11, color: "#d4d4d4" },
              { text: new Date().toLocaleDateString("ru-RU"), fontSize: 11, color: "#d4d4d4", alignment: "right" },
            ],
            margin: [0, 120, 0, 0],
          },
        ],
        background: "#111111",
        pageBreak: "after",
      });

      content.push({
        table: {
          widths: getPdfWidths(),
          body: [getPdfHeaderRow()],
        },
        layout: {
          fillColor: () => "#111111",
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 0],
      });

      Object.entries(groupedItems).forEach(([sectionName, sectionItems]) => {
        const rows = buildPdfProductRows(sectionItems, imageMap as Record<string, string>);
        if (rows.length === 0) return;

        const sectionTitle = {
          text: sectionName,
          bold: true,
          fontSize: 9,
          fillColor: "#f4f4f5",
          margin: [4, 2, 0, 2],
        };

        content.push({
          unbreakable: true,
          stack: [
            { table: { widths: ["*"], body: [[sectionTitle]] }, layout: "noBorders", margin: [0, 4, 0, 0] },
            {
              table: { widths: getPdfWidths(), body: [rows[0]] },
              layout: {
                hLineColor: () => "#e5e5e5",
                vLineColor: () => "#e5e5e5",
                hLineWidth: () => 0.4,
                vLineWidth: () => 0,
                paddingTop: () => 4,
                paddingBottom: () => 4,
              },
            },
          ],
        });

        if (rows.length > 1) {
          content.push({
            table: { widths: getPdfWidths(), body: rows.slice(1) },
            layout: {
              hLineColor: () => "#e5e5e5",
              vLineColor: () => "#e5e5e5",
              hLineWidth: () => 0.4,
              vLineWidth: () => 0,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          });
        }
      });

      const serviceRows: any[] = [];
      if (pricesVisible && !includeServices && cleanNumber(deliveryCost) > 0) {
        serviceRows.push([
          { svg: deliveryIconSvg, fit: [32, 32], alignment: "center" },
          { text: "Доставка", bold: true },
          ...(showSpecs ? [""] : []),
          { text: "1", alignment: "center" },
          { text: formatRub(cleanNumber(deliveryCost)), alignment: "right", noWrap: true },
          { text: "—", alignment: "right" },
          { text: formatRub(cleanNumber(deliveryCost)), alignment: "right", noWrap: true },
          { text: formatRub(cleanNumber(deliveryCost)), alignment: "right", bold: true, noWrap: true },
          ...(showStock ? [""] : []),
        ]);
      }

      if (pricesVisible && !includeServices && cleanNumber(installationCost) > 0) {
        serviceRows.push([
          { svg: assemblyIconSvg, fit: [32, 32], alignment: "center" },
          { text: "Сборка", bold: true },
          ...(showSpecs ? [""] : []),
          { text: "1", alignment: "center" },
          { text: formatRub(cleanNumber(installationCost)), alignment: "right", noWrap: true },
          { text: "—", alignment: "right" },
          { text: formatRub(cleanNumber(installationCost)), alignment: "right", noWrap: true },
          { text: formatRub(cleanNumber(installationCost)), alignment: "right", bold: true, noWrap: true },
          ...(showStock ? [""] : []),
        ]);
      }

      if (serviceRows.length > 0) {
        content.push({
          table: { widths: getPdfWidths(), body: serviceRows },
          layout: {
            hLineColor: () => "#e5e5e5",
            vLineColor: () => "#e5e5e5",
            hLineWidth: () => 0.4,
            vLineWidth: () => 0,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        });
      }

      if (pricesVisible) {
        content.push({
          table: {
            widths: ["*", 120],
            body: [
              [
                { text: "Розничная цена", color: "#555555" },
                { text: formatRub(retailProductsTotal + (!includeServices ? servicesTotal : 0)), alignment: "right", bold: true },
              ],
              [
                { text: "Скидка", color: "#555555" },
                { text: formatRub(productsDiscountTotal), alignment: "right", bold: true },
              ],
              [
                { text: "Итоговая цена с учётом скидки", color: "#737373" },
                { text: formatRub(total), alignment: "right", bold: true, color: "#f97316" },
              ],
            ],
          },
          layout: {
            hLineColor: (i: number) => (i === 0 || i === 3 ? "#f97316" : "#d4d4d8"),
            vLineWidth: () => 0,
            hLineWidth: (i: number) => (i === 0 || i === 3 ? 1.2 : 0.4),
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 12, 0, 0],
        });
      }

      if (comment) {
        content.push({ text: `Комментарий: ${comment}`, margin: [0, 12, 0, 0], fontSize: 8, color: "#333333" });
      }

      const docDefinition: any = {
        pageSize: "A4",
        pageMargins: [10, 10, 10, 18],
        defaultStyle: { font: "Roboto", fontSize: 8, color: "#111111" },
        content,
        footer: (currentPage: number) => {
          if (currentPage === 1) return {};

          return {
            margin: [10, 0, 10, 0],
            stack: [
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 0.4, lineColor: "#e5e5e5" }] },
              {
                columns: [
                  { text: "ATLAS FORGE · Профессиональное силовое оборудование", color: "#737373", fontSize: 7 },
                  { text: `Страница ${currentPage - 1}`, alignment: "right", color: "#737373", fontSize: 7 },
                ],
                margin: [0, 4, 0, 0],
              },
            ],
          };
        },
      };

      pdfMakeInstance.createPdf(docDefinition).download(`${offerNumber || "KP"}.pdf`);
    } catch (error: any) {
      alert(error.message || "Ошибка при формировании PDF");
    } finally {
      if (mode === "no-prices") {
        setShowPrices(originalShowPrices);
      }
      setGeneratingPdf(false);
    }
  };

  const exportToExcel = async () => {
    setGeneratingExcel(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ATLAS FORGE";
      workbook.created = new Date();

      const cover = workbook.addWorksheet("Титульный лист", {
        properties: { defaultRowHeight: 24 },
      });

      cover.columns = [
        { width: 24 },
        { width: 28 },
        { width: 28 },
        { width: 28 },
      ];

      cover.mergeCells("A1:D4");
      cover.getCell("A1").value = "ATLAS FORGE";
      cover.getCell("A1").font = { size: 30, bold: true, color: { argb: "FFFFFFFF" } };
      cover.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
      cover.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

      cover.mergeCells("A6:D6");
      cover.getCell("A6").value = `Коммерческое предложение ${offerNumber}`;
      cover.getCell("A6").font = { size: 20, bold: true };
      cover.getCell("A6").alignment = { horizontal: "center" };

      const coverRows = [
        ["Клиент", clientName || "—"],
        ["Город", city || "—"],
        ["Объект", objectName || "—"],
        ["Менеджер", selectedManager?.name || "—"],
        ["Дата", new Date().toLocaleDateString("ru-RU")],
      ];

      coverRows.forEach((row, index) => {
        const rowNumber = 8 + index;
        cover.getCell(`A${rowNumber}`).value = row[0];
        cover.getCell(`B${rowNumber}`).value = row[1];
        cover.getCell(`A${rowNumber}`).font = { bold: true };
        cover.mergeCells(`B${rowNumber}:D${rowNumber}`);
      });

      const sheet = workbook.addWorksheet("КП", {
        properties: { defaultRowHeight: 24 },
        pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1 },
      });

      const columns = [
        { header: "Фото", key: "photo", width: 14 },
        { header: "Артикул", key: "sku", width: 14 },
        { header: "Наименование", key: "name", width: showSpecs ? 28 : 38 },
        ...(showSpecs ? [{ header: "Характеристики", key: "specs", width: 28 }] : []),
        { header: "Кол-во", key: "quantity", width: 9 },
        ...(showPrices
          ? [
              { header: "Цена", key: "retail", width: 15 },
              { header: "Скидка", key: "discount", width: 15 },
              { header: "Со скидкой", key: "custom", width: 17 },
              { header: "Сумма", key: "total", width: 17 },
            ]
          : []),
        ...(showStock ? [{ header: "Наличие", key: "stock", width: 16 }] : []),
      ];

      sheet.columns = columns as any;

      sheet.mergeCells(1, 1, 2, columns.length);
      sheet.getCell(1, 1).value = `ATLAS FORGE · КП ${offerNumber}`;
      sheet.getCell(1, 1).font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
      sheet.getCell(1, 1).alignment = { vertical: "middle", horizontal: "center" };
      sheet.getRow(1).height = 34;

      const headerRowNumber = 4;
      columns.forEach((column, index) => {
        const cell = sheet.getCell(headerRowNumber, index + 1);
        cell.value = column.header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E5E5" } },
          bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
          left: { style: "thin", color: { argb: "FFE5E5E5" } },
          right: { style: "thin", color: { argb: "FFE5E5E5" } },
        };
      });

      let rowNumber = 5;

      for (const [sectionName, sectionItems] of Object.entries(groupedItems)) {
        sheet.mergeCells(rowNumber, 1, rowNumber, columns.length);
        const sectionCell = sheet.getCell(rowNumber, 1);
        sectionCell.value = sectionName;
        sectionCell.font = { bold: true };
        sectionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };
        sectionCell.alignment = { vertical: "middle" };
        sheet.getRow(rowNumber).height = 18;
        rowNumber += 1;

        for (const item of sectionItems) {
          const row = sheet.getRow(rowNumber);
          row.height = 74;

          const values: any[] = [
            "",
            item.sku,
            item.custom_name,
            ...(showSpecs ? [specsToLines(item.specs).join("\n") || "—"] : []),
            item.quantity,
            ...(showPrices
              ? [
                  item.retail_price,
                  getDiscountAmount(item) || "—",
                  item.custom_price,
                  item.custom_price * item.quantity + serviceSharePerItem,
                ]
              : []),
            ...(showStock ? [item.delivery_time || deliveryTime || "—"] : []),
          ];

          values.forEach((value, index) => {
            const cell = row.getCell(index + 1);
            cell.value = value;
            cell.alignment = { vertical: "middle", wrapText: true };
            cell.border = {
              top: { style: "thin", color: { argb: "FFE5E5E5" } },
              bottom: { style: "thin", color: { argb: "FFE5E5E5" } },
              left: { style: "thin", color: { argb: "FFE5E5E5" } },
              right: { style: "thin", color: { argb: "FFE5E5E5" } },
            };

            if (showPrices && typeof value === "number" && index >= values.length - (showStock ? 5 : 4)) {
              cell.numFmt = '#,##0 "₽"';
            }
          });

          row.getCell(3).value = {
            text: item.custom_name,
            hyperlink: getProductUrl(item),
          } as any;
          row.getCell(3).font = { bold: true, color: { argb: "FF1155CC" }, underline: true };

          if (item.image) {
            const buffer = await fetchImageBuffer(item.image);
            if (buffer) {
              const imageId = workbook.addImage({
                buffer: buffer as any,
                extension: getImageExtension(item.image),
              });

              sheet.addImage(imageId, {
                tl: { col: 0.2, row: rowNumber - 0.9 },
                ext: { width: 66, height: 66 },
              });
            }
          }

          rowNumber += 1;
        }
      }

      if (showPrices && !includeServices && cleanNumber(deliveryCost) > 0) {
        sheet.addRow(["", "", "Доставка", ...(showSpecs ? [""] : []), 1, cleanNumber(deliveryCost), "—", cleanNumber(deliveryCost), cleanNumber(deliveryCost), ...(showStock ? [""] : [])]);
        rowNumber += 1;
      }

      if (showPrices && !includeServices && cleanNumber(installationCost) > 0) {
        sheet.addRow(["", "", "Сборка", ...(showSpecs ? [""] : []), 1, cleanNumber(installationCost), "—", cleanNumber(installationCost), cleanNumber(installationCost), ...(showStock ? [""] : [])]);
        rowNumber += 1;
      }

      if (showPrices) {
        rowNumber += 1;
        sheet.mergeCells(rowNumber, 1, rowNumber, columns.length - 1);
        sheet.getCell(rowNumber, 1).value = "Розничная цена";
        sheet.getCell(rowNumber, columns.length).value = retailProductsTotal + (!includeServices ? servicesTotal : 0);
        rowNumber += 1;

        sheet.mergeCells(rowNumber, 1, rowNumber, columns.length - 1);
        sheet.getCell(rowNumber, 1).value = "Скидка";
        sheet.getCell(rowNumber, columns.length).value = productsDiscountTotal;
        rowNumber += 1;

        sheet.mergeCells(rowNumber, 1, rowNumber, columns.length - 1);
        sheet.getCell(rowNumber, 1).value = "Итоговая цена с учётом скидки";
        sheet.getCell(rowNumber, columns.length).value = total;
        sheet.getCell(rowNumber, columns.length).font = { bold: true, color: { argb: "FFF97316" } };
      }

      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = { ...cell.alignment, vertical: "middle" };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${offerNumber || "KP"}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || "Ошибка при выгрузке Excel");
    } finally {
      setGeneratingExcel(false);
    }
  };


  const updateOfferStatus = async (id: string, status: string) => {
    await supabase
      .from("commercial_offers")
      .update({ status })
      .eq("id", id);

    loadData();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Удалить КП? Это действие нельзя отменить.")) return;
    const offer = savedOffers.find((item) => item.id === id);

if (offer?.client_id) {
  await supabase.from("client_history").insert({
    client_id: offer.client_id,
    event_type: "offer_deleted",
    description: `Удалено КП: ${offer.offer_number || "Без номера"}`,
  });
}

    const { error } = await supabase
      .from("commercial_offers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (currentOfferId === id) {
      createNewOffer();
    }

    loadData();
  };


  useEffect(() => {
  if (!savedOffers.length) return;

  const params = new URLSearchParams(window.location.search);

  const offerId =
    params.get("offerId") ||
    localStorage.getItem("openOfferId") ||
    localStorage.getItem("managerOpenOfferId");

  if (!offerId) return;

  loadOfferById(offerId);

  localStorage.removeItem("openOfferId");
  localStorage.removeItem("managerOpenOfferId");
}, [savedOffers]);

  return (
    <main className="bg-[#111111] text-white min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 py-15">
       
       <ManagerHeader
  title="Конструктор КП"
  currentManager={currentManager}
/>

        <ManagerTabs
  active="kp"
  tasksCount={dashboardOpenTasks.length}
  leadsCount={newCartLeadsCount}
/>


        

        <div className="grid xl:grid-cols-[1fr_420px] gap-8 mt-12 items-start">
          <section className="space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-black">Подбор оборудования</h2>

                <div className="flex flex-wrap gap-3">
                  <input
                    value={offerNumber}
                    onChange={(e) => setOfferNumber(e.target.value)}
                    className="bg-black border border-zinc-700 rounded-xl p-3 w-44"
                    placeholder="Номер КП"
                  />

                  <button
                    onClick={() => setShowOffersModal(true)}
                    className="border border-zinc-700 hover:border-orange-500 transition rounded-xl px-5 py-3 font-bold"
                  >
                    Выбрать сохранённое КП
                  </button>

                  <button
                    onClick={createNewOffer}
                    className="border border-zinc-700 hover:border-white transition rounded-xl px-5 py-3 font-bold"
                  >
                    Новое КП
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_1fr_2fr] gap-4">
                <select
                  value={sectionId}
                  onChange={(e) => {
                    setSectionId(e.target.value);
                    setSubcategory("");
                  }}
                  className="bg-black border border-zinc-700 rounded-xl p-4"
                >
                  <option value="">Все разделы</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>

                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={!sectionId}
                  className="bg-black border border-zinc-700 rounded-xl p-4"
                >
                  <option value="">Все подразделы</option>
                  {availableSubcategories.map((item) => (
                    <option key={item.id} value={item.title}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск товара"
                  className="bg-black border border-zinc-700 rounded-xl p-4"
                />
              </div>

              <div className="mt-6 h-[560px] overflow-auto border border-zinc-800 rounded-3xl">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="grid md:grid-cols-[80px_1fr_150px_auto] gap-4 items-center p-4 border-b border-zinc-800 last:border-b-0 hover:bg-white/5"
                  >
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-full h-full object-contain p-2"
                        />
                      )}
                    </div>

                    <div>
                      <div className="text-orange-500 text-xs uppercase tracking-widest">
                        {product.sku}
                      </div>
                      <div className="font-bold mt-1">{product.name}</div>
                      <div className="text-zinc-500 text-sm mt-1">
                        {product.category}
                      </div>
                    </div>

                    <div className="text-right font-black text-orange-500">
                      {formatRub(getProductPrice(product))}
                    </div>

                    <button
                      onClick={() => addProduct(product)}
                      className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-5 py-3 font-bold"
                    >
                      Добавить
                    </button>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="p-8 text-zinc-500">Товары не найдены.</div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-black">Товары в КП</h2>

                <div className="flex flex-wrap gap-3">
                  <input
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="Срок поставки"
                    className="w-40 bg-black border border-zinc-700 rounded-xl p-3"
                  />

                  <button
                    onClick={applyDeliveryTime}
                    className="border border-zinc-700 hover:border-orange-500 transition rounded-xl px-5 py-3 font-bold"
                  >
                    Применить срок
                  </button>

                  <input
                    value={massDiscount}
                    onChange={(e) => setMassDiscount(e.target.value.replace(/\D/g, ""))}
                    placeholder="Скидка %"
                    className="w-32 bg-black border border-zinc-700 rounded-xl p-3"
                  />

                  <button
                    onClick={applyDiscount}
                    className="bg-orange-500 hover:bg-orange-600 transition rounded-xl px-5 py-3 font-bold"
                  >
                    Применить скидку
                  </button>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm min-w-[1280px]">
                  <thead className="bg-black text-zinc-400">
                    <tr>
                      <th className="p-3 text-left">✓</th>
                      <th className="p-3 text-left whitespace-nowrap">Товар</th>
                      <th className="p-3 text-left whitespace-nowrap">Название в КП</th>
                      <th className="p-3 text-center whitespace-nowrap">Кол-во</th>
                      <th className="p-3 text-right w-40 whitespace-nowrap">Цена</th>
                      <th className="p-3 text-center w-28 whitespace-nowrap">Скидка %</th>
                      <th className="p-3 text-right w-44 whitespace-nowrap">Цена КП</th>
                      <th className="p-3 text-left whitespace-nowrap">Срок</th>
                      <th className="p-3 text-right w-48 whitespace-nowrap">Сумма</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-zinc-800">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateItem(item.id, "selected", e.target.checked)}
                          />
                        </td>

                        <td className="p-3">
                          <div className="text-orange-500 text-xs">{item.sku}</div>
                          <div className="font-bold">{item.name}</div>
                        </td>

                        <td className="p-3">
                          <input
                            value={item.custom_name}
                            onChange={(e) => updateItem(item.id, "custom_name", e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-2"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value || 1))}
                            className="w-20 bg-black border border-zinc-700 rounded-lg p-2 text-center"
                          />
                        </td>

                        <td className="p-3 text-right w-40 whitespace-nowrap">
                          {formatRub(item.retail_price)}
                        </td>

                        <td className="p-3">
                          <input
                            value={item.discount ? formatNumber(item.discount) : ""}
                            onChange={(e) => {
                              const discount = cleanNumber(e.target.value);
                              updateItem(item.id, "discount", discount);
                              updateItem(
                                item.id,
                                "custom_price",
                                Math.round(item.retail_price - item.retail_price * (discount / 100)),
                              );
                            }}
                            className="w-24 bg-black border border-zinc-700 rounded-lg p-2 text-right"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            value={formatRub(item.custom_price)}
                            onChange={(e) => updateItem(item.id, "custom_price", cleanNumber(e.target.value))}
                            className="w-44 bg-black border border-zinc-700 rounded-lg p-2 text-right"
                          />
                        </td>

                        <td className="p-3">
                          <input
                            value={item.delivery_time}
                            onChange={(e) => updateItem(item.id, "delivery_time", e.target.value)}
                            placeholder="Напр. 30 дней"
                            className="w-36 bg-black border border-zinc-700 rounded-lg p-2"
                          />
                        </td>

                        <td className="p-3 text-right font-black text-orange-500 w-48 whitespace-nowrap">
                          {formatRub(item.custom_price * item.quantity + serviceSharePerItem)}
                        </td>

                        <td className="p-3 text-right">
                          <button onClick={() => deleteItem(item.id)} className="text-red-500">
                            удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {items.length === 0 && (
                  <div className="p-8 text-zinc-500">Добавьте товары в КП.</div>
                )}
              </div>
            </div>
          </section>

          <aside className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-28">
            <h2 className="text-3xl font-black">Настройки КП</h2>

            <div className="space-y-4 mt-6">
              <button
                onClick={() => setShowClientsModal(true)}
                className="w-full border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-4 font-bold"
              >
                Выбрать клиента из CRM
              </button>

              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Имя клиента / компания"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Телефон клиента"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Город"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

              <input
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                placeholder="Объект / адрес"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

                            {clientId && (
                <div className="bg-black border border-zinc-800 rounded-2xl p-4">
                  <div className="text-orange-500 font-black mb-3">
                    CRM клиента
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-500">Статус</span>
                      <span className="font-bold">{clientStatusText}</span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-500">КП клиента</span>
                      <span className="font-bold">{selectedClientOffers.length}</span>
                    </div>

                    <div className="border-t border-zinc-800 pt-3 mt-3">
                      <div className="text-zinc-500 mb-1">
                        Ближайшая задача
                      </div>

                      <div className="font-bold">
                        {nextClientTask?.title || "Нет открытых задач"}
                      </div>

                      {nextClientTask?.due_date && (
                        <div className="text-zinc-500 mt-1">
                          {nextClientTask.due_date}
                        </div>
                      )}
                    </div>


<div className="border-t border-zinc-800 pt-3 mt-3 space-y-3">
  <div className="text-zinc-500 text-sm">
    Новая задача
  </div>
<div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => {
      setQuickTaskTitle("Позвонить клиенту");
      setQuickTaskStatus("contact");
    }}
    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-orange-500 text-sm"
  >
    Позвонить
  </button>

  <button
    type="button"
    onClick={() => {
      setQuickTaskTitle("Отправить КП");
      setQuickTaskStatus("offer");
    }}
    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-orange-500 text-sm"
  >
    КП
  </button>

  <button
    type="button"
    onClick={() => {
      setQuickTaskTitle("Назначить встречу");
      setQuickTaskStatus("meeting");
    }}
    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-orange-500 text-sm"
  >
    Встреча
  </button>

  <button
    type="button"
    onClick={() => {
      setQuickTaskTitle("Получить оплату");
      setQuickTaskStatus("payment");
    }}
    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-orange-500 text-sm"
  >
    Оплата
  </button>
</div>
  <input
    value={quickTaskTitle}
    onChange={(e) => setQuickTaskTitle(e.target.value)}
    placeholder="Название задачи"
    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2"
  />

  <input
    type="date"
    value={quickTaskDate}
    onChange={(e) => setQuickTaskDate(e.target.value)}
    onFocus={(e) => e.currentTarget.showPicker?.()}
    onClick={(e) => e.currentTarget.showPicker?.()}
    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white cursor-pointer"
  />

  <select
    value={quickTaskStatus}
    onChange={(e) => setQuickTaskStatus(e.target.value)}
    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2"
  >
    <option value="contact">Связаться</option>
    <option value="meeting">Встреча</option>
    <option value="offer">Отправить КП</option>
    <option value="payment">Оплата</option>
    <option value="other">Другое</option>
  </select>

  <button
    onClick={addQuickTask}
    className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl px-4 py-2 font-bold"
  >
    Создать задачу
  </button>
</div>
<button
  onClick={() => {
    localStorage.setItem("openClientId", clientId);
    window.location.href = `/manager/clients?clientId=${clientId}`;
  }}
  className="w-full mt-3 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-4 py-3 font-bold"
>
  Открыть карточку клиента
</button>
                    
                  </div>
                </div>
              )}

              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              >
                <option value="">Выберите менеджера</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>

              <input
                value={deliveryCost ? formatRub(cleanNumber(deliveryCost)) : ""}
                onChange={(e) => setDeliveryCost(String(cleanNumber(e.target.value)))}
                placeholder="Доставка, ₽"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

              <input
                value={installationCost ? formatRub(cleanNumber(installationCost)) : ""}
                onChange={(e) => setInstallationCost(String(cleanNumber(e.target.value)))}
                placeholder="Сборка, ₽"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4"
              />

              <label className="flex gap-3 text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeServices}
                  onChange={(e) => setIncludeServices(e.target.checked)}
                />
                Размыть доставку и сборку в стоимость товара
              </label>

              <label className="flex gap-3 text-zinc-300">
                <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} />
                Отображать столбец наличия
              </label>

              <label className="flex gap-3 text-zinc-300">
                <input type="checkbox" checked={!showPrices} onChange={(e) => setShowPrices(!e.target.checked)} />
                Выгрузка КП без цен
              </label>

              <label className="flex gap-3 text-zinc-300">
                <input type="checkbox" checked={showSpecs} onChange={(e) => setShowSpecs(e.target.checked)} />
                Выгрузить характеристики отдельным столбцом
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4 min-h-28"
              />
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6 space-y-3">
              <div className="flex justify-between text-zinc-400">
                <span>Товары</span>
                <span className="text-white font-bold">{formatRub(totalProducts)}</span>
              </div>

              {!includeServices && cleanNumber(deliveryCost) > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Доставка</span>
                  <span className="text-white font-bold">{formatRub(cleanNumber(deliveryCost))}</span>
                </div>
              )}

              {!includeServices && cleanNumber(installationCost) > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Сборка</span>
                  <span className="text-white font-bold">{formatRub(cleanNumber(installationCost))}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                <span className="text-zinc-400">Итого</span>
                <span className="text-orange-500 text-3xl font-black">{formatRub(total)}</span>
              </div>
            </div>

            <button
              onClick={saveOffer}
              disabled={items.length === 0}
              className="w-full mt-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition rounded-xl px-6 py-4 font-bold"
            >
              Сохранить КП
            </button>

            {currentOfferId && (
              <button
                onClick={() => deleteOffer(currentOfferId)}
                className="w-full mt-4 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl px-6 py-4 font-bold"
              >
                Удалить текущее КП
              </button>
            )}

            <button
              onClick={() => generatePdf("current")}
              disabled={items.length === 0 || generatingPdf}
              className="w-full mt-4 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-4 font-bold"
            >
              {generatingPdf ? "Формируем..." : "PDF КП"}
            </button>

            <button
              onClick={() => generatePdf("no-prices")}
              disabled={items.length === 0 || generatingPdf}
              className="w-full mt-4 border border-zinc-700 hover:border-orange-500 transition rounded-xl px-6 py-4 font-bold"
            >
              PDF без цен
            </button>

            <button
              onClick={exportToExcel}
              disabled={items.length === 0 || generatingExcel}
              className="w-full mt-4 border border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition rounded-xl px-6 py-4 font-bold"
            >
              {generatingExcel ? "Формируем Excel..." : "Excel КП"}
            </button>
          </aside>
        </div>
      </div>


      {showClientsModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center px-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Выбор клиента</h2>
                <div className="text-zinc-500 mt-1">
                  Найдено: {filteredClients.length}
                </div>
              </div>

              <button
                onClick={() => setShowClientsModal(false)}
                className="w-12 h-12 rounded-xl border border-zinc-700 hover:border-red-500 hover:text-red-500 transition"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Поиск по имени, телефону, городу или объекту"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-6"
              />

              <div className="overflow-auto max-h-[520px] border border-zinc-800 rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-black text-zinc-400 sticky top-0">
                    <tr>
                      <th className="p-4 text-left">Имя</th>
                      <th className="p-4 text-left">Телефон</th>
                      <th className="p-4 text-left">Город</th>
                      <th className="p-4 text-left">Объект</th>
                      <th className="p-4 text-right">Действие</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-zinc-800 hover:bg-white/5">
                        <td className="p-4 font-bold">{client.name || "Без имени"}</td>
                        <td className="p-4">{client.phone || "—"}</td>
                        <td className="p-4">{client.city || "—"}</td>
                        <td className="p-4 text-zinc-400">{client.object_name || "—"}</td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => selectClient(client)}
                            className="bg-orange-500 hover:bg-orange-600 transition px-5 py-2 rounded-xl font-bold"
                          >
                            Выбрать
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredClients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          Клиенты не найдены.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOffersModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center px-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Сохранённые КП</h2>
                <div className="text-zinc-500 mt-1">
                  Найдено: {filteredSavedOffers.length}
                </div>
              </div>

              <button
                onClick={() => setShowOffersModal(false)}
                className="w-12 h-12 rounded-xl border border-zinc-700 hover:border-red-500 hover:text-red-500 transition"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <input
                value={offerSearchCity}
                onChange={(e) => setOfferSearchCity(e.target.value)}
                placeholder="Поиск по городу"
                className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-6"
              />

              <div className="overflow-auto max-h-[520px] border border-zinc-800 rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-black text-zinc-400 sticky top-0">
                    <tr>
                      <th className="p-4 text-left">Номер КП</th>
                      <th className="p-4 text-left">Имя клиента</th>
                      <th className="p-4 text-left">Город</th>
                      <th className="p-4 text-left">Объект</th>
                      <th className="p-4 text-right">Действие</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSavedOffers.map((offer) => (
                      <tr key={offer.id} className="border-b border-zinc-800 hover:bg-white/5">
                        <td className="p-4 font-bold text-orange-500">
                          {offer.offer_number || "Без номера"}
                        </td>

                        <td className="p-4">{offer.client_name || "Без клиента"}</td>

                        <td className="p-4">{offer.city || "Без города"}</td>

                        <td className="p-4 text-zinc-400">{offer.object_name || "—"}</td>

                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => loadOfferById(offer.id)}
                              className="bg-orange-500 hover:bg-orange-600 transition px-5 py-2 rounded-xl font-bold"
                            >
                              Загрузить
                            </button>

                            <button
                              onClick={() => deleteOffer(offer.id)}
                              className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition px-4 py-2 rounded-xl font-bold"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredSavedOffers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          КП не найдены.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
