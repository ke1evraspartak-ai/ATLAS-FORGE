import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const IMPORT_SECTION = "Импорт V-Sport";
const IMPORT_CATEGORY = "Неразобранное";

const getFirstTag = (xml: string, tag: string) => {
  const matches = [
    ...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi")),
  ];

  return matches.find((item) => item[1]?.trim())?.[1]?.trim() || "";
};

const getTags = (xml: string, tag: string) => {
  return [
    ...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi")),
  ]
    .map((item) => item[1].trim())
    .filter(Boolean);
};

const decodeHtml = (value: string) => {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&amp;/g, "&");
};

const stripHtml = (html: string) => {
  return decodeHtml(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const makeSlug = (name: string, sku: string) => {
  return `${sku}-${name}`
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
};

const getRawSpecs = (description: string) => {
  const rawSpecs: Record<string, string> = {};
  const html = decodeHtml(description);

  [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].forEach((row) => {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (cell) => stripHtml(cell[1]),
    );

    if (cells.length >= 2 && cells[0] && cells[1]) {
      rawSpecs[cells[0]] = cells[1];
    }
  });

  return rawSpecs;
};

const findSpecValue = (specs: Record<string, string>, words: string[]) => {
  const key = Object.keys(specs).find((item) =>
    words.some((word) => item.toLowerCase().includes(word.toLowerCase())),
  );

  return key ? specs[key] : "";
};

const getSpecs = (description: string) => {
  const rawSpecs = getRawSpecs(description);

  return {
    "Нагрузка, кг": findSpecValue(rawSpecs, [
      "грузовой стек",
      "нагрузка",
      "максимальный вес пользователя",
    ]),
    "Длина, мм": findSpecValue(rawSpecs, ["длина"]),
    "Ширина, мм": findSpecValue(rawSpecs, ["ширина"]),
    "Высота, мм": findSpecValue(rawSpecs, ["высота"]),
    "Вес": findSpecValue(rawSpecs, [
      "общий вес",
      "вес нетто",
      "вес тренажера",
      "вес",
    ]),
  };
};

const getCleanDescription = (descriptionHtml: string) => {
  let html = decodeHtml(descriptionHtml);

  html = html
    .replace(/<img[\s\S]*?>/gi, " ")
    .split("Оплата и доставка")[0]
    .split("Руководство по сборке")[0]
    .split("Условия сборки")[0]
    .split("Гарантия")[0]
    .trim();

  return html;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "XML-файл не передан" },
        { status: 400 },
      );
    }

    const xml = await file.text();

    const offers = [...xml.matchAll(/<offer[^>]*>([\s\S]*?)<\/offer>/gi)];

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const offer of offers) {
      const offerXml = offer[1];

      const vendorCodes = getTags(offerXml, "vendorCode");
      const sku = vendorCodes.find(Boolean) || "";

      const name = stripHtml(getFirstTag(offerXml, "name"));
      const price = Number(getFirstTag(offerXml, "price") || 0);
      const descriptionHtml = getFirstTag(offerXml, "description");
      const url = getFirstTag(offerXml, "url");
      const pictures = getTags(offerXml, "picture");
      const categoryId = getFirstTag(offerXml, "categoryId");

const skipCategoryIds = [
  "29", // Тренажеры для дома
  "30", // Домашние тренажеры для кардио
  "78", // Беговые дорожки для дома
  "79", // Эллиптические тренажеры для дома
  "80", // Велотренажеры для дома
];

if (skipCategoryIds.includes(categoryId)) {
  skipped += 1;
  continue;
}

      if (!sku || !name) {
        skipped += 1;
        continue;
      }

      const description = getCleanDescription(descriptionHtml);

      const updatePayload = {
        name,
        price,
        description,
        image: pictures[0] || null,
        images: pictures,
        specs: {},
        slug: makeSlug(name, sku),
        meta_title: name,
        meta_description: description.slice(0, 250),
        source: "vsport",
        source_url: url,
      };

      const insertPayload = {
        ...updatePayload,
        sku,
        section: IMPORT_SECTION,
        category: IMPORT_CATEGORY,
      };

      const { data: existing, error: findError } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku)
        .limit(1);

      if (findError) {
        skipped += 1;
        errors.push(`${sku}: ${findError.message}`);
        continue;
      }

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", existing[0].id);

        if (error) {
          skipped += 1;
          errors.push(`${sku}: ${error.message}`);
        } else {
          updated += 1;
        }
      } else {
        const { error } = await supabase.from("products").insert(insertPayload);

        if (error) {
          skipped += 1;
          errors.push(`${sku}: ${error.message}`);
        } else {
          inserted += 1;
        }
      }
    }

    return NextResponse.json({
      inserted,
      updated,
      skipped,
      total: offers.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Ошибка импорта V-Sport" },
      { status: 500 },
    );
  }
}