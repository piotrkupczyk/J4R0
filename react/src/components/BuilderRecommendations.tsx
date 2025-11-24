// src/components/BuilderRecommendations.tsx
import { useEffect, useMemo, useState } from "react";
import { getCatalog } from "../lib/api";
import type { Produkt, TypProduktu } from "../types";

type PcKind = "office" | "standard" | "gaming";

type Props = {
  pcType: PcKind | null;
  gpuFamily: string | null;
  cpuVendor: string | null;
  socket: string | null;
  gpuVram: number | null;
  ram: string | null;
  storage: string | null;
  build: Partial<Record<TypProduktu, Produkt>>;
  onPickPart?: (type: TypProduktu, produkt: Produkt) => void;
};

const DEBUG_SHOW_ALL = false; // MUST HAVE: filtry są WŁĄCZONE

// ——— pomocnicze: liczba z "32 GB", "1 TB" itp. ———
function toNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const s = String(v).replace(",", ".").toUpperCase().trim();
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// ——— mapowanie typu z API -> enum typu produktu ———
function mapType(raw: any): Produkt["typ"] {
  const t = String(raw?.typ ?? raw?.type ?? "").toLowerCase();
  switch (t) {
    case "cpu": return "CPU";
    case "gpu": return "GPU";
    case "mobo":
    case "motherboard": return "MOBO";
    case "ram": return "RAM";
    case "psu": return "PSU";
    case "case":
    case "chassis": return "CASE";
    case "storage":
    case "disk":
    case "drive":
    case "ssd":
    case "hdd": return "DYSK";
    case "cooler":
    case "cooling": return "COOLER";
    default:
      if (raw?.sizeGB != null || raw?.readMBs != null || raw?.writeMBs != null) return "DYSK";
      return (t.toUpperCase() as Produkt["typ"]) || "CPU";
  }
}

// ——— adapter danych API -> Produkt ———
function adaptToProdukt(api: any): Produkt {
  const typ = mapType(api);
  const wspolne = {
    id: api.id,
    typ,
    nazwa: api.nazwa ?? api.name,
    cena: api.cena ?? api.price ?? 0,
  };

  if (typ === "DYSK") {
    return {
      ...wspolne,
      interfejs: api.interfejs ?? api.iface ?? null,
      format: api.format ?? api.formFactor ?? null,
      pojemnosc_gb: toNum(api.pojemnosc_gb ?? api.sizeGB),
      predkosc_odczytu: toNum(api.predkosc_odczytu ?? api.readMBs),
      predkosc_zapisu: toNum(api.predkosc_zapisu ?? api.writeMBs),
    } as Produkt;
  }

  if (typ === "CPU") {
    return {
      ...wspolne,
      socket: api.socket ?? null,
      rdzenie: toNum(api.rdzenie ?? api.cores),
      watki: toNum(api.watki ?? api.threads),
      tdp: toNum(api.tdp),
    } as Produkt;
  }

  if (typ === "GPU") {
    return {
      ...wspolne,
      chipset: api.chipset ?? null,
      vram: toNum(api.vram ?? api.vram_gb),
      gddr: api.gddr ?? null,
      tdp: toNum(api.tdp),
      dlugosc: toNum(api.dlugosc ?? api.length_mm),
    } as Produkt;
  }

  if (typ === "MOBO") {
    return {
      ...wspolne,
      socket: api.socket ?? null,
      ddr: api.ddr ?? null,
      chipset: api.chipset ?? null,
      format: api.format ?? null,
      sloty_m2: toNum(api.sloty_m2 ?? api.m2_slots),
    } as Produkt;
  }

  if (typ === "RAM") {
    return {
      ...wspolne,
      ddr: api.ddr ?? null,
      taktowanie: toNum(api.taktowanie ?? api.mhz),
      clock_latency: toNum(api.clock_latency ?? api.cl),
      pojemnosc_total: toNum(api.pojemnosc_total ?? api.capacity_gb),
      liczba_modulow: toNum(api.liczba_modulow ?? api.modules),
      pojemnosc_modulu: toNum(api.pojemnosc_modulu),
      rgb: api.rgb ?? null,
      profil: toNum(api.profil) as 0 | 1 | null,
    } as Produkt;
  }

  if (typ === "PSU") {
    return {
      ...wspolne,
      moc: toNum(api.moc ?? api.wattage),
      certyfikat: api.certyfikat ?? api.cert ?? null,
      modularny: api.modularny ?? api.modular ?? null,
    } as Produkt;
  }

  if (typ === "CASE") {
    return {
      ...wspolne,
      wysokosc: toNum(api.wysokosc ?? api.height_mm),
      dlugosc: toNum(api.dlugosc ?? api.length_mm),
      szerokosc: toNum(api.szerokosc ?? api.width_mm),
      ilosc_wentylatorow: toNum(api.ilosc_wentylatorow),
      format: api.format ?? null,
      rgb: api.rgb ?? null,
    } as Produkt;
  }

  if (typ === "COOLER") {
    return {
      ...wspolne,
      typ_coolera: api.typ_coolera ?? api.cooler_type ?? null,
      wysokosc: toNum(api.wysokosc ?? api.height_mm),
      ilosc_wentylatorow: toNum(api.ilosc_wentylatorow),
      sockety: api.sockety ?? api.sockets ?? null,
      rgb: api.rgb ?? null,
    } as Produkt;
  }

  return wspolne as Produkt;
}

// ——— filtrowanie po preferencjach użytkownika ———
function passesFilters(
  p: Produkt,
  opts: Pick<
    Props,
    "pcType" | "gpuFamily" | "cpuVendor" | "socket" | "gpuVram" | "ram" | "storage"
  >
): boolean {
  const { pcType, gpuFamily, cpuVendor, socket, gpuVram, ram, storage } = opts;

  // 1) Ogólny filtr zależny od typu komputera
  if (pcType === "office") {
    // biurowy – nie pokazujemy dedykowanych GPU
    if (p.typ === "GPU") {
      return false;
    }
    // CPU raczej chłodne
    if (p.typ === "CPU" && p.tdp != null && p.tdp > 80) {
      return false;
    }
  }

  if (pcType === "gaming") {
    // gaming – wymagamy sensownej karty
    if (p.typ === "GPU" && p.vram != null && p.vram < 8) {
      return false;
    }
    // RAM co najmniej 16 GB
    if (p.typ === "RAM" && p.pojemnosc_total != null && p.pojemnosc_total < 16) {
      return false;
    }
  }

  // 2) GPU – vendor + minimalny VRAM
  if (p.typ === "GPU") {
    if (gpuFamily) {
      const n = p.nazwa.toLowerCase();
      if (gpuFamily === "nvidia" && !n.includes("rtx") && !n.includes("gtx") && !n.includes("nvidia")) {
        return false;
      }
      if (gpuFamily === "amd" && !n.includes("rx") && !n.includes("radeon") && !n.includes("amd")) {
        return false;
      }
      if (gpuFamily === "intel" && !n.includes("intel") && !n.includes("arc")) {
        return false;
      }
    }
    if (gpuVram != null && p.vram != null && p.vram < gpuVram) {
      return false;
    }
  }

  // 3) CPU – vendor + socket
  if (p.typ === "CPU") {
    if (cpuVendor && !p.nazwa.toLowerCase().includes(cpuVendor.toLowerCase())) {
      return false;
    }
    if (socket && p.socket && p.socket !== socket) {
      return false;
    }
  }

  // 4) MOBO – socket
  if (p.typ === "MOBO") {
    if (socket && p.socket && p.socket !== socket) {
      return false;
    }
  }

  // 5) RAM – minimalna pojemność (32 GB, 16 GB itd.)
  if (p.typ === "RAM" && ram) {
    const selected = toNum(ram); // np. 32 z "32 GB"
    const capacity = p.pojemnosc_total ?? null;
    if (selected && capacity && capacity < selected) {
      return false;
    }
  }

  // 6) DYSK – minimalna pojemność dysku
  if (p.typ === "DYSK" && storage) {
    const selected = toNum(storage); // np. 512 z "512 GB SSD"
    const capacity = p.pojemnosc_gb ?? null;
    if (selected && capacity && capacity < selected) {
      return false;
    }
  }

  return true;
}


/* === KOMPONENT GŁÓWNY === */

export default function BuilderRecommendations(props: Props) {
  const {
    pcType,
    gpuFamily,
    cpuVendor,
    socket,
    gpuVram,
    ram,
    storage,
  } = props;

  const [items, setItems] = useState<Produkt[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await getCatalog();
        const mapped: Produkt[] = (Array.isArray(raw) ? raw : (raw as any)?.items ?? [])
          .map(adaptToProdukt);
        if (alive) {
          console.debug("Katalog debug (typy):", Array.from(new Set(mapped.map(x => x.typ))));
          setItems(mapped);
        }
      } catch (e) {
        console.warn("BuilderRecommendations fetch failed:", e);
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(
    () =>
      DEBUG_SHOW_ALL
        ? items
        : items.filter((p) =>
            passesFilters(p, { pcType, gpuFamily, cpuVendor, socket, gpuVram, ram, storage })
          ),
    [items, pcType, gpuFamily, cpuVendor, socket, gpuVram, ram, storage]
  );

  const Section = ({ title, type }: { title: string; type: Produkt["typ"] }) => {
  const list = filtered.filter((it) => it.typ === type);
  if (!list.length) return null;

  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-semibold">{title}</div>
      </div>

      <div className="space-y-3">
        {list.map((it) => {
          const selected = props.build?.[type as TypProduktu]?.id === it.id;

          return (
            <div
              key={`${type}-${it.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                borderColor: selected ? "var(--accent)" : "var(--border)",
                background: selected
                  ? "color-mix(in oklab, var(--accent) 10%, var(--surface))"
                  : "color-mix(in oklab, var(--surface) 85%, transparent)",
              }}
            >
              <div
                className="h-10 w-10 rounded-lg"
                style={{
                  background:
                    "color-mix(in oklab, var(--surface) 60%, transparent)",
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.nazwa}</div>
                <div className="text-xs opacity-70 truncate">{metaFor(it)}</div>
              </div>

              <div className="text-sm font-semibold whitespace-nowrap">
                {new Intl.NumberFormat("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                }).format(it.cena ?? 0)}
              </div>

              <button
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  selected ? "bg-[var(--accent)] text-white" : ""
                }`}
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  cursor: selected ? "default" : "pointer",
                }}
                disabled={selected}
                onClick={() => !selected && props.onPickPart?.(type as TypProduktu, it)}
              >
                {selected ? "Wybrano ✓" : "Wybierz"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {pcType === "office" ? (
        <>
          <Section title="Procesory ze zintegrowaną grafiką" type="CPU" />
          <Section title="Płyty główne" type="MOBO" />
        </>
      ) : (
        <>
          <Section title="Karty graficzne" type="GPU" />
          <Section title="Procesory" type="CPU" />
          <Section title="Płyty główne" type="MOBO" />
        </>
      )}
      <Section title="Pamięć RAM" type="RAM" />
      <Section title="Obudowy" type="CASE" />
      <Section title="Zasilacze" type="PSU" />
      <Section title="Dyski / Storage" type="DYSK" />
      <Section title="Chłodzenia CPU" type="COOLER" />
    </div>
  );
}

// ——— Meta do podtytułów kart ———
function metaFor(p: Produkt) {
  switch (p.typ) {
    case "CPU":
      return [
        p.socket ? `Socket ${p.socket}` : null,
        p.tdp ? `TDP ${p.tdp}W` : null,
        p.rdzenie && p.watki ? `${p.rdzenie}/${p.watki} rd/wą` : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "GPU":
      return [
        p.chipset ?? null,
        p.vram ? `${p.vram}GB ${p.gddr ?? ""}`.trim() : null,
        p.tdp ? `TDP ${p.tdp}W` : null,
        p.dlugosc ? `${p.dlugosc}mm` : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "MOBO":
      return [
        p.socket ? `Socket ${p.socket}` : null,
        p.ddr ?? null,
        p.chipset ?? null,
        p.format ?? null,
        p.sloty_m2 ? `M.2 ×${p.sloty_m2}` : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "RAM":
      return [
        p.ddr ?? null,
        p.taktowanie ? `${p.taktowanie} MHz` : null,
        p.clock_latency ? `CL${p.clock_latency}` : null,
        p.pojemnosc_total && p.liczba_modulow
          ? `${p.liczba_modulow}×${Math.round(
              p.pojemnosc_total / p.liczba_modulow
            )} GB`
          : p.pojemnosc_total
          ? `${p.pojemnosc_total} GB`
          : null,
        (p as any).rgb ? "RGB" : null,
        (p as any).profil === 0
          ? "Low Profile"
          : (p as any).profil === 1
          ? "High Profile"
          : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "PSU":
      return [
        p.moc ? `${p.moc}W` : null,
        p.certyfikat ?? null,
        (p as any).modularny ? "Modularny" : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "CASE":
      return [
        p.format ?? null,
        p.ilosc_wentylatorow ? `Wentylatory: ${p.ilosc_wentylatorow}` : null,
        p.wysokosc ? `${p.wysokosc}mm` : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "COOLER":
      return [
        p.typ_coolera ?? null,
        p.sockety ?? null,
        p.wysokosc ? `${p.wysokosc}mm` : null,
      ]
        .filter(Boolean)
        .join(", ");

    case "DYSK":
      return [
        p.interfejs ?? null,
        p.format ?? null,
        p.pojemnosc_gb ? `${p.pojemnosc_gb} GB` : null,
        p.predkosc_odczytu ? `R: ${p.predkosc_odczytu} MB/s` : null,
        p.predkosc_zapisu ? `W: ${p.predkosc_zapisu} MB/s` : null,
      ]
        .filter(Boolean)
        .join(", ");

    default:
      return "";
  }
}
