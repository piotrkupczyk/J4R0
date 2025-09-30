// src/lib/api.ts
export const API_BASE =
  import.meta?.env?.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export const fmtPL = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});


// ── Vite env (upewnij się, że masz plik src/vite-env.d.ts – patrz niżej)
export type ItemType = "GPU" | "CPU" | "MOBO" | "RAM" | "PSU" | "CASE" | "STORAGE" | "COOLER";

// Jeden ujednolicony typ dla kreatora
export type CatalogItem = {
  id: number;
  type: ItemType;
  name: string;
  price: number;
  // opcjonalne pola używane w meta/filtrach:
  chipset?: string; vram?: number; gddr?: string; tdp?: number; dlugosc?: number;
  socket?: string;
  // RAM:
  pojemnosc_total?: number; liczba_modulow?: number; pojemnosc_modulu?: number;
  taktowanie?: number; clock_latency?: number; ddr?: string;
  // Cooler:
  typ?: string; wysokosc?: number; typ_coolera?: string; ilosc_wentylatorow?: number;
  rgb?: number; profil?: number;
};



async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

export async function getCatalog(): Promise<CatalogItem[]> {
  const endpoints = [
    "/products/gpu-joined",
    "/products/cpu-joined",
    "/products/mobo-joined",
    "/products/ram-joined",
    "/products/psu-joined",
    "/products/case-joined",
    "/products/storage-joined",
    "/products/cooler-joined",
  ];
  const settled = await Promise.allSettled(
    endpoints.map((p) => fetchJSON<CatalogItem[]>(`${API_BASE}${p}`))
  );

  const merged: CatalogItem[] = [];
  settled.forEach((r) => {
    if (r.status === "fulfilled" && Array.isArray(r.value)) merged.push(...r.value);
  });
  return merged;
}
