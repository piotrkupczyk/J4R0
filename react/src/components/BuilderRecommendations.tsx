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

  // NOWE filtry
  
  ramModules: number | null;
  moboWifi: boolean | null;
  psuModular: boolean | null;
  coolerType: "air" | "aio" | "water" | null;

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
// ——— adapter danych API -> Produkt ———
function adaptToProdukt(api: any): Produkt {
  const typ = mapType(api);

  const wspolne = {
    id: api.id,
    typ,
    nazwa: api.nazwa ?? api.name,
    cena: api.cena ?? api.price ?? 0,
  };

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
      dlugosc: toNum(api.dlugosc ?? api.length_mm ?? api.length),
    } as Produkt;
  }

  if (typ === "MOBO") {
    return {
      ...wspolne,
      socket: api.socket ?? null,
      ddr: api.ddr ?? api.ramType ?? null,
      chipset: api.chipset ?? null,
      format: api.format ?? api.formFactor ?? null,
      sloty_m2: toNum(api.sloty_m2 ?? api.m2_slots),
    } as Produkt;
  }

  if (typ === "RAM") {
    // KLUCZOWE: mapujemy stare pola -> nowe
    const total = toNum(api.pojemnosc_total ?? api.capacity_gb ?? api.size);
    const modules = toNum(api.liczba_modulow ?? api.modules);
    const perModule =
      toNum(api.pojemnosc_modulu ?? api.perModule) ??
      (total && modules ? total / modules : null);

    return {
      ...wspolne,
      ddr: api.ddr ?? api.ramType ?? null,
      taktowanie: toNum(api.taktowanie ?? api.mhz),
      clock_latency: toNum(api.clock_latency ?? api.cl),
      pojemnosc_total: total,
      liczba_modulow: modules,
      pojemnosc_modulu: perModule,
      rgb: api.rgb ?? null,
      profil: (toNum(api.profil) as 0 | 1 | null) ?? null,
    } as Produkt;
  }

  if (typ === "PSU") {
    return {
      ...wspolne,
      moc: toNum(api.moc ?? api.wattage ?? api.power),
      certyfikat: api.certyfikat ?? api.cert ?? api.certificate ?? null,
      modularny: api.modularny ?? api.modular ?? null,
    } as Produkt;
  }

  if (typ === "CASE") {
    return {
      ...wspolne,
      wysokosc: toNum(api.wysokosc ?? api.height_mm ?? api.height),
      dlugosc: toNum(api.dlugosc ?? api.length_mm ?? api.length ?? api.depth),
      szerokosc: toNum(api.szerokosc ?? api.width_mm ?? api.width),
      ilosc_wentylatorow: toNum(api.ilosc_wentylatorow ?? api.fans ?? api.fan_count),
      format: api.format ?? api.formFactor ?? null,
      rgb: api.rgb ?? null,
    } as Produkt;
  }

  if (typ === "DYSK") {
    return {
      ...wspolne,
      interfejs: api.interfejs ?? api.iface ?? api.interface ?? null,
      format: api.format ?? api.formFactor ?? null,
      pojemnosc_gb: toNum(api.pojemnosc_gb ?? api.sizeGB ?? api.size),
      predkosc_odczytu: toNum(api.predkosc_odczytu ?? api.readMBs ?? api.read),
      predkosc_zapisu: toNum(api.predkosc_zapisu ?? api.writeMBs ?? api.write),
    } as Produkt;
  }

  if (typ === "COOLER") {
    return {
      ...wspolne,
      typ_coolera: api.typ_coolera ?? api.cooler_type ?? api.type ?? null,
      wysokosc: toNum(api.wysokosc ?? api.height_mm ?? api.height),
      ilosc_wentylatorow: toNum(api.ilosc_wentylatorow ?? api.fans ?? api.fan_count),
      sockety: api.sockety ?? api.sockets ?? null,
      rgb: api.rgb ?? null,
    } as Produkt;
  }

  return wspolne as Produkt;
}



function storageStringToGB(s: string): number | null {
  if (!s) return null;
  const up = s.toUpperCase();
  const num = toNum(up); // np. 1, 2, 512
  if (!num) return null;
  if (up.includes("TB")) return num * 1000; // 1 TB -> 1000 GB (upraszczamy 1000)
  // domyślnie GB
  return num;
}

type FilterOpts = {
  pcType: PcKind | null;
  gpuFamily: string | null;
  cpuVendor: string | null;
  socket: string | null;
  gpuVram: number | null;
  ram: string | null;
  storage: string | null;
  ramModules: number | null;
  moboWifi: boolean | null;
  psuModular: boolean | null;
  coolerType: "air" | "aio" | "water" | null;
  build: Partial<Record<TypProduktu, Produkt>>;
};

// ——— filtrowanie po preferencjach użytkownika ———
function passesFilters(p: Produkt, opts: FilterOpts): boolean {
  const {
    pcType,
    gpuFamily,
    cpuVendor,
    socket,
    gpuVram,
    ram,
    storage,
    ramModules,
    moboWifi,
    psuModular,
    coolerType,
    build,
  } = opts;

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
    if (socket && p.socket && p.socket !== socket) return false;
  }

  // 5) RAM – minimalna pojemność (z wyboru 16/32/64 GB)
  if (p.typ === "RAM" && ram) {
  const wanted = toNum(ram);
  if (wanted != null && p.pojemnosc_total != null && p.pojemnosc_total !== wanted) {
    return false;
  }
}

// RAM – dokładna liczba modułów
if (p.typ === "RAM" && ramModules != null && p.liczba_modulow != null) {
  if (p.liczba_modulow !== ramModules) return false;
}

    // 6) DYSK – pojemność + rodzaj (SSD / HDD)
// 6) DYSK – minimalna pojemność (np. „1 TB SSD”)
  if (p.typ === "DYSK" && storage) {
  const wantedGB = storageStringToGB(storage);
  const capGB = p.pojemnosc_gb ?? storageStringToGB(p.nazwa) ?? null;
  if (wantedGB != null && capGB != null) {
    const tolerance = wantedGB * 0.05;
    if (Math.abs(capGB - wantedGB) > tolerance) return false;
  }
}


  // 7) MOBO – Wi-Fi tak/nie
  if (p.typ === "MOBO" && moboWifi !== null) {
    const wifi = (p as any).wifi;
    if (wifi != null && Boolean(wifi) !== moboWifi) return false;
  }

  // 8) PSU – modularny / niemodularny
  if (p.typ === "PSU" && psuModular !== null) {
    const modularny = (p as any).modularny;
    if (modularny != null && Boolean(modularny) !== psuModular) return false;
  }

  // 9) COOLER – typ chłodzenia (air / aio / water)
  if (p.typ === "COOLER" && coolerType) {
    const kind = (p.typ_coolera ?? "").toString().toLowerCase();
    if (kind) {
      if (coolerType === "air" && !kind.includes("air")) return false;
      if (coolerType === "aio" && !kind.includes("aio")) return false;
      if (coolerType === "water" && !(kind.includes("water") || kind.includes("liquid"))) {
        return false;
      }
    }
  }


 // 10) Zależności od już wybranych komponentów (build)

  const cpu = build.CPU;
  const mobo = build.MOBO;
  const ramSelected = build.RAM;
  const gpu = build.GPU;
  //const psu = build.PSU;
  const obudowa = build.CASE;
  const cooler = build.COOLER;

  // CPU musi pasować do już wybranej płyty
  if (p.typ === "CPU" && mobo?.socket && p.socket && p.socket !== mobo.socket) {
    return false;
  }

  // MOBO musi pasować do już wybranego CPU
  if (p.typ === "MOBO" && cpu?.socket && p.socket && p.socket !== cpu.socket) {
    return false;
  }

  // RAM musi pasować do wybranej płyty (DDR4/DDR5)
  if (p.typ === "RAM" && mobo?.ddr && p.ddr && p.ddr !== mobo.ddr) {
    return false;
  }

  // MOBO vs RAM (gdy RAM już wybrany)
  if (p.typ === "MOBO" && ramSelected?.ddr && p.ddr && p.ddr !== ramSelected.ddr) {
    return false;
  }

  // CASE – rozmiar pod GPU i cooler
  if (p.typ === "CASE") {
    const gpuLength = gpu?.dlugosc;
    const caseGpuLength = p.dlugosc;
    if (
      typeof gpuLength === "number" &&
      typeof caseGpuLength === "number" &&
      gpuLength > caseGpuLength
    ) {
      return false;
    }

    const coolerHeight = cooler?.wysokosc;
    const caseCoolerHeight = p.wysokosc;
    if (
      typeof coolerHeight === "number" &&
      typeof caseCoolerHeight === "number" &&
      coolerHeight > caseCoolerHeight
    ) {
      return false;
    }

    const moboFormat = mobo?.format ?? null;
    const caseFormat = p.format ?? null;
    if (moboFormat && caseFormat && moboFormat !== caseFormat) {
      return false;
    }
  }

  // GPU – długość do już wybranej obudowy
  if (p.typ === "GPU") {
    const caseLength = obudowa?.dlugosc;
    const gpuLength = p.dlugosc;
    if (
      typeof caseLength === "number" &&
      typeof gpuLength === "number" &&
      gpuLength > caseLength
    ) {
      return false;
    }
  }

    // COOLER – socket + wysokość vs CASE
  if (p.typ === "COOLER") {
    // socket CPU
    const cpuSocket = cpu?.socket;
    const socketsStr = p.sockety ? String(p.sockety) : "";

    // tu TS ma już pewność, że cpuSocket to string
    if (
      typeof cpuSocket === "string" &&
      socketsStr &&
      !socketsStr.includes(cpuSocket)
    ) {
      return false;
    }

    // wysokość coolera vs obudowa
    const caseHeight = obudowa?.wysokosc;
    const coolerHeight = p.wysokosc;
    if (
      typeof caseHeight === "number" &&
      typeof coolerHeight === "number" &&
      coolerHeight > caseHeight
    ) {
      return false;
    }
  }


  // PSU – moc vs TDP CPU+GPU (prosty próg)
  if (p.typ === "PSU") {
    const tdpCpu = typeof cpu?.tdp === "number" ? cpu!.tdp! : 0;
    const tdpGpu = typeof gpu?.tdp === "number" ? gpu!.tdp! : 0;
    const potrzebnaMoc = tdpCpu + tdpGpu + 150; // zapas
    if (typeof p.moc === "number" && p.moc < potrzebnaMoc) {
      return false;
    }
  }

  if (p.typ === "DYSK") {
    console.log("DISK DEBUG", {
      nazwa: p.nazwa,
      storage,
      pojemnosc_gb: p.pojemnosc_gb,
      rodzaj: (p as any).rodzaj,
    });
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
          passesFilters(p, {
            pcType,
            gpuFamily,
            cpuVendor,
            socket,
            gpuVram,
            ram,
            storage,
            ramModules: props.ramModules,
            moboWifi: props.moboWifi,
            psuModular: props.psuModular,
            coolerType: props.coolerType,
            build: props.build,
          })
        ),
  [
    items,
    pcType,
    gpuFamily,
    cpuVendor,
    socket,
    gpuVram,
    ram,
    storage,
    props.ramModules,
    props.moboWifi,
    props.psuModular,
    props.coolerType,
    props.build,
  ]
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
                {selected ? "Wybrano" : "Wybierz"}
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
function j(...xs: (string | null | undefined | false)[]) {
  return xs.filter(Boolean).join(', ');
}
const flag = (v?: boolean | null, label?: string) => (v ? (label ?? 'Tak') : null);
const fmtW = (v?: number | null) => v ? `${v}W` : null;
const fmtMHz = (v?: number | null) => v ? `${v} MHz` : null;
const fmtMM = (v?: number | null) => v ? `${v}mm` : null;
const fmtGB = (v?: number | null) => v ? `${v} GB` : null;
const fmtRW = (r?: number|null, w?: number|null) =>
  (r || w) ? j(r ? `R: ${r} MB/s` : null, w ? `W: ${w} MB/s` : null) : null;

function ramCapacityLine(total?: number|null, mods?: number|null, perMod?: number|null) {
  if (mods && perMod) return `${mods}×${perMod} GB`;
  if (total && mods)   return `${mods}×${Math.round(total / mods)} GB`;
  if (total)           return `${total} GB`;
  return null;
}
// ——— Meta do podtytułów kart ———
function metaFor(p: Produkt) {
  switch (p.typ) {
    case 'CPU':
      return j(
        p.socket ? `Socket ${p.socket}` : null,
        p.rdzenie && p.watki ? `${p.rdzenie}/${p.watki} rdzenie/watki` : null,
        fmtW(p.tdp)
      );

    case 'GPU':
      return j(
        // vendor zwykle siedzi w nazwie, ale to podbija czytelność
        // (jeśli nie chcesz – usuń pierwszą linijkę)
        p.nazwa?.toLowerCase().includes('nvidia') ? 'NVIDIA' :
        p.nazwa?.toLowerCase().includes('radeon') || p.nazwa?.toLowerCase().includes('amd') ? 'AMD' :
        p.nazwa?.toLowerCase().includes('intel') ? 'Intel' : null,
        p.chipset ?? null,
        p.vram ? `${p.vram} GBB ${p.gddr ?? ''}`.trim() : null,
        fmtW(p.tdp),
        fmtMM(p.dlugosc)
      );

    case 'MOBO':
      return j(
        p.socket ? `Socket ${p.socket}` : null,
        p.chipset ?? null,
        p.ddr ? `RAM ${p.ddr}` : null,
        p.format ?? null,
        p.sloty_m2 ? `M.2 ×${p.sloty_m2}` : null
      );

    case 'RAM':
      return j(
        p.ddr ?? null,                              // DDR4 / DDR5
        fmtMHz(p.taktowanie),                       // np. 6000 MHz
        p.clock_latency ? `CL${p.clock_latency}` : null,
        ramCapacityLine(p.pojemnosc_total, p.liczba_modulow, p.pojemnosc_modulu),
        (p as any).profil === 0 ? 'Low Profile'
          : (p as any).profil === 1 ? 'High Profile' : null,
        flag((p as any).rgb, 'RGB')
      );

    case 'PSU':
      return j(
        fmtW(p.moc),
        p.certyfikat ?? null,
        (p as any).modularny ? 'Modularny' : null
      );

    case 'CASE':
      return j(
        p.format ?? null,
        p.ilosc_wentylatorow ? `Wentylatory: ${p.ilosc_wentylatorow}` : null,
        // pełne wymiary jeżeli mamy jakiekolwiek 2 z 3
        (p.szerokosc || p.wysokosc || p.dlugosc)
          ? j(
              p.szerokosc ? `Szer ${p.szerokosc}mm` : null,
              p.wysokosc ? `Wys ${p.wysokosc}mm` : null,
              p.dlugosc ? `Gł ${p.dlugosc}mm` : null,
            )
          : null,
        flag((p as any).rgb, 'RGB')
      );

    case 'COOLER':
      return j(
        p.typ_coolera ?? null,
        p.sockety?.length ? `Sockety: ${p.sockety.join('/')}` : null,
        fmtMM(p.wysokosc),
        p.ilosc_wentylatorow ? `${p.ilosc_wentylatorow}× fan` : null,
        flag((p as any).rgb, 'RGB')
      );

    case 'DYSK':
      return j(
        p.interfejs ?? null,          // NVMe / SATA
        p.format ?? null,             // M.2 2280 / 2.5"
        fmtGB(p.pojemnosc_gb),
        fmtRW(p.predkosc_odczytu, p.predkosc_zapisu)
      );

    default:
      return '';
  }
}

