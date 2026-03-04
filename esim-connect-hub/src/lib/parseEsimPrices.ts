/**
 * Parse eSIM prices CSV from eSIMAccess
 */
export interface EsimPriceRow {
  type: string;
  plan: string;
  location: string;
  planName: string;
  price: number;
  history: number[] | null;
  gbs: string;
  days: number;
  pricePerGb: number | null;
  size: string;
  sms: string;
  top: string;
  act: string;
  ip: string;
  code: string;
  slug: string;
  planId: string;
}

function parseNumber(val: string): number | null {
  const v = val?.trim();
  if (!v || v === "undefined" || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parseHistory(val: string): number[] | null {
  const v = val?.trim();
  if (!v || v === "undefined") return null;
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function cleanStr(val: string): string {
  const v = val?.trim();
  return v === "undefined" || !v ? "" : v;
}

export function parseEsimPricesCsv(csvText: string): EsimPriceRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: EsimPriceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," && !inQuotes) || (c === "\n" && !inQuotes)) {
        values.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    values.push(current);

    const get = (idx: number) => cleanStr(values[idx] ?? "");
    const getNum = (idx: number) => parseNumber(values[idx] ?? "");
    const getHist = (idx: number) => parseHistory(values[idx] ?? "");

    const typeIdx = headers.indexOf("Type");
    const planIdx = headers.indexOf("Plan");
    const locIdx = headers.indexOf("Location");
    const nameIdx = headers.indexOf("Plan Name");
    const priceIdx = headers.indexOf("Price");
    const histIdx = headers.indexOf("History");
    const gbsIdx = headers.indexOf("GBs");
    const daysIdx = headers.indexOf("Days");
    const perGbIdx = headers.indexOf("$/GB");
    const sizeIdx = headers.indexOf("Size");
    const smsIdx = headers.indexOf("SMS");
    const topIdx = headers.indexOf("Top");
    const actIdx = headers.indexOf("Act");
    const ipIdx = headers.indexOf("IP");
    const codeIdx = headers.indexOf("Code");
    const slugIdx = headers.indexOf("Slug");
    const planIdIdx = headers.indexOf("PlanId");

    rows.push({
      type: get(typeIdx >= 0 ? typeIdx : 1),
      plan: get(planIdx >= 0 ? planIdx : 2),
      location: get(locIdx >= 0 ? locIdx : 3),
      planName: get(nameIdx >= 0 ? nameIdx : 4),
      price: getNum(priceIdx >= 0 ? priceIdx : 5) ?? 0,
      history: getHist(histIdx >= 0 ? histIdx : 6),
      gbs: get(gbsIdx >= 0 ? gbsIdx : 7),
      days: getNum(daysIdx >= 0 ? daysIdx : 8) ?? 0,
      pricePerGb: getNum(perGbIdx >= 0 ? perGbIdx : 9),
      size: get(sizeIdx >= 0 ? sizeIdx : 10),
      sms: get(smsIdx >= 0 ? smsIdx : 11),
      top: get(topIdx >= 0 ? topIdx : 12),
      act: get(actIdx >= 0 ? actIdx : 13),
      ip: get(ipIdx >= 0 ? ipIdx : 14),
      code: get(codeIdx >= 0 ? codeIdx : 15),
      slug: get(slugIdx >= 0 ? slugIdx : 16),
      planId: get(planIdIdx >= 0 ? planIdIdx : 17),
    });
  }

  return rows;
}

/** Infer plan size from data allowance */
export function inferSize(gbs: string): string {
  const m = gbs.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)/i);
  if (!m) return "M";
  const num = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  const valueGb = unit === "GB" ? num : num / 1024;
  if (valueGb < 1) return "S";
  if (valueGb < 5) return "M";
  if (valueGb < 20) return "L";
  return "XL";
}
