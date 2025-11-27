import React, { useState } from "react";
import BuilderRecommendations from "./components/BuilderRecommendations";
import type { Produkt, TypProduktu, CompatResult} from "./types";
import { checkCompatibility, saveSet } from './lib/api';


/* --- DATA --- */

type PcType = "office" | "standard" | "gaming";

const PC_TYPES: { key: PcType; label: string; icon: string; desc: string }[] = [
  { key: "office",   label: "Biurowy",    icon: "💼", desc: "Idealny do biura i nauki" },
  { key: "standard", label: "Standardowy",icon: "🧩", desc: "Niezbędny w codziennym użytkowaniu" },
  { key: "gaming",   label: "Gamingowy",  icon: "🎮", desc: "Dla wymagających użytkowników" },
];

const GPU_FAMILIES = [
  { key: "nvidia", label: "Nvidia" },
  { key: "amd",    label: "AMD" },
  { key: "intel",  label: "Intel" },
] as const;

const CPU_VENDORS = [
  { key: "amd",   label: "AMD" },
  { key: "intel", label: "Intel" },
] as const;

const SOCKETS_BY_VENDOR: Record<string, string[]> = {
  amd:   ["AM4", "AM5"],
  intel: ["LGA1700"],
};

const VRAM_CHOICES: (number | null)[] = [null, 6, 8, 12, 16, 24];

const RAM_BY_TYPE: Record<PcType, string[]> = {
  office:   ["8 GB", "16 GB", "32 GB"],
  standard: ["16 GB", "32 GB", "64 GB"],
  gaming:   ["32 GB", "64 GB", "128 GB", "256 GB"],
};

const STORAGE_BY_TYPE: Record<PcType, string[]> = {
  office:   ["256 GB SSD", "512 GB SSD", "1 TB SSD"],
  standard: ["1 TB SSD", "2 TB SSD"],
  gaming:   ["1 TB SSD", "2 TB SSD", "4 TB SSD"],
};

/* --- MAIN COMPONENT --- */

export default function PCBuilderPage() {
  // --- STANY FILTRÓW (przykład; dostosuj do swoich kontrolek) ---
  const [pcType, setPcType] = useState<"office" | "standard" | "gaming" | null>(null);
  const [gpuFamily, setGpuFamily] = useState<string | null>(null); // 'nvidia' | 'amd' | 'intel' | null
  const [cpuVendor, setCpuVendor] = useState<string | null>(null);  // 'intel' | 'amd' | null
  const [socket, setSocket] = useState<string | null>(null);        // 'AM4' | 'AM5' | 'LGA1700' | null
  const [gpuVram, setGpuVram] = useState<number | null>(null);      // np. 8, 12
  const [ram, setRam] = useState<string | null>(null);      
  const [ramModules, setRamModules] = useState<number | null>(null); // NOWE: liczba kości RAM        // np. '16 GB', '32 GB'
  const [storage, setStorage] = useState<string | null>(null);  
  const [step, setStep] = useState(1);    // np. '512 GB', '1 TB'
  const [moboWifi, setMoboWifi] = useState<boolean | null>(null);    // NOWE: MOBO WiFi
  const [psuModular, setPsuModular] = useState<boolean | null>(null); // NOWE: PSU modularny
  const [coolerType, setCoolerType] = useState<"air" | "aio" | "water" | null>(null);    
  const [compat, setCompat] = useState<CompatResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

{savedId !== null && (
  <div className="mt-3 text-sm rounded border px-3 py-2"
       style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
    ✅ Zestaw zapisany (ID: <b>{savedId}</b>).
  </div>
)}

function buildToPayload(build: Partial<Record<TypProduktu, Produkt>>){
  return (Object.entries(build) as [TypProduktu, Produkt][])
    .filter(([, p]) => !!p)
    .map(([typ, p]) => ({ typ, id: p.id, ilosc: 1 }));
}




  /* ==== TWÓJ ZESTAW ==== */

  const [build, setBuild] = useState<Partial<Record<TypProduktu, Produkt>>>({});
  const [compatResult, setCompatResult] =
    useState<null | { compatible: boolean; errors: string[] }>(null);

  const handlePickPart = async (typ: TypProduktu, produkt: Produkt) => {
    setBuild(prev => ({ ...prev, [typ]: produkt }));

    await fetch("/api/builder/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        component_type: typ,
        product_id: produkt.id,
      }),
    });
  };

  const handleRemovePart = async (typ: TypProduktu) => {
    setBuild(prev => {
      const copy = { ...prev };
      delete copy[typ];
      return copy;
    });

    await fetch("/api/builder/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ component_type: typ }),
    });
  };

  

  const handleClearBuild = async () => {
    setBuild({});
    setCompatResult(null);
    try {
      await fetch("/api/builder/clear", { method: "POST" });
    } catch (e) {
      console.warn("Nie udało się wyczyścić zestawu w backendzie", e);
    }
  };
  
const hasAnyPart = Object.keys(build).length > 0;

async function onCheckCompat() {
  try {
    if (!hasAnyPart) return;
    setChecking(true);
    setSavedId(null);               // reset info o zapisie
    const items = buildToPayload(build);
    const res: CompatResult = await checkCompatibility(items);
    setCompat(res);
  } catch (e) {
    setCompat({ ok:false, issues:[{ level:'error', message:'Błąd serwera lub sieci.' }], warnings:[] });
    console.warn(e);
  } finally {
    setChecking(false);
  }
}

async function onSaveSet() {
  if (!compat?.ok) return;          // zapobiegawczo
  try {
    setSaving(true);
    const items = buildToPayload(build);
    const out = await saveSet(items, `Zestaw ${new Date().toLocaleDateString('pl-PL')}`);
    setSavedId(out.id_zestawu);
  } catch (e) {
    console.warn(e);
    alert('Nie udało się zapisać zestawu.');
  } finally {
    setSaving(false);
  }
}
  /* ==== VISIBILITY / KROKI ==== */

  const isOffice   = pcType === "office";
  const isStandard = pcType === "standard";
  const isGaming   = pcType === "gaming";

  const showVendors = !!pcType;

  const showMemory =
    (isOffice && !!cpuVendor) ||
    ((isStandard || isGaming) && (!!gpuFamily || !!cpuVendor));

  const showParts = isOffice
    ? !!cpuVendor && !!ram && !!storage
    : (!!gpuFamily || !!cpuVendor) && !!ram && !!storage;

  const step2Label = isOffice ? "CPU (iGPU)" : "Preferencje GPU/CPU";
  const step3Label = "Pamięć";
  const step4Label = "Podzespoły";

  const RAM_OPTIONS = pcType ? RAM_BY_TYPE[pcType] : RAM_BY_TYPE.office;
  const STORAGE_OPTIONS = pcType ? STORAGE_BY_TYPE[pcType] : STORAGE_BY_TYPE.office;

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* HEADER */}
        <header className="sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center gap-3 bg-transparent">
            <span className="text-lg">🛠️</span>
            <span className="font-semibold tracking-tight">Kreator PC</span>
          </div>
        </header>

        {/* STEPPER */}
        <nav className="px-4 py-4">
          <ol className="mx-auto max-w-5xl flex items-center gap-4 text-sm justify-center">
            <StepDot active={step >= 1} label="Typ komputera" onClick={() => setStep(1)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 2 && showVendors} label={step2Label} onClick={() => showVendors && setStep(2)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 3 && showMemory} label={step3Label} onClick={() => showMemory && setStep(3)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 4 && showParts} label={step4Label} onClick={() => showParts && setStep(4)} />
          </ol>
        </nav>

        <main className="px-4 pb-8 space-y-8">
          {/* 1. Typ komputera */}
          <Section
            title="1. Typ komputera"
            subtitle="Do czego planujesz używać komputera?"
          >
            <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
              {PC_TYPES.map((item) => (
                <SelectableCard
                  key={item.key}
                  selected={pcType === item.key}
                  icon={item.icon}
                  title={item.label}
                  description={item.desc}
                  onClick={() => {
                    const changed = pcType !== item.key;
                    setPcType(item.key);
                    setStep(2);
                    if (changed) {
                      // reset dalszych wyborów
                      setGpuFamily(null);
                      setCpuVendor(null);
                      setSocket(null);
                      setGpuVram(null);
                      setRam(null);
                      setRamModules(null);   // NOWE
                      setStorage(null);
                      setMoboWifi(null);     // NOWE
                      setPsuModular(null);   // NOWE
                      setCoolerType(null);   // NOWE
                    }
                  }}
                />
              ))}
            </div>
          </Section>

          {/* 2. Preferencje CPU / GPU */}
          <Section
            title="2. Preferencje CPU / GPU"
            subtitle="Zaznacz preferencje dotyczące producenta procesora i karty graficznej."
            muted={!showVendors}
          >
            {!showVendors && (
              <p className="text-sm opacity-70">
                Najpierw wybierz typ komputera.
              </p>
            )}

            {showVendors && (
            <div className="mx-auto max-w-5xl space-y-4">
              {/* GPU: producent + VRAM w jednym rzędzie */}
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Producent GPU */}
                <div className="flex-1">
                  <div className="text-sm font-medium mb-2">
                    Producent karty graficznej
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GPU_FAMILIES.map((g) => (
                      <TogglePill
                        key={g.key}
                        label={g.label}
                        active={gpuFamily === g.key}
                        onClick={() => {
                          setGpuFamily((prev) =>
                            prev === g.key ? null : g.key
                          );
                          setStep(3);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Minimalna pamięć VRAM – OBOK producenta GPU */}
                {!isOffice && (
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2">
                      Minimalna pamięć VRAM karty graficznej
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VRAM_CHOICES.map((v) => (
                        <TogglePill
                          key={v ?? "any"}
                          label={v == null ? "Dowolna" : `${v} GB`}
                          active={gpuVram === v}
                          onClick={() =>
                            setGpuVram((prev) => (prev === v ? null : v))
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CPU vendor */}
              <div>
                <div className="text-sm font-medium mb-2">
                  Producent procesora
                </div>
                <div className="flex flex-wrap gap-2">
                  {CPU_VENDORS.map((c) => (
                    <TogglePill
                      key={c.key}
                      label={c.label}
                      active={cpuVendor === c.key}
                      onClick={() => {
                        const next = cpuVendor === c.key ? null : c.key;
                        setCpuVendor(next);
                        setSocket(null);
                        setStep(3);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Socket – jak było */}
              {cpuVendor && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    Socket procesora
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(SOCKETS_BY_VENDOR[cpuVendor] ?? []).map((s) => (
                      <TogglePill
                        key={s}
                        label={s}
                        active={socket === s}
                        onClick={() =>
                          setSocket((prev) => (prev === s ? null : s))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          </Section>

         {/* 3. Pamięć */}
<Section
  title="3. Pamięć (RAM i dysk)"
  subtitle="Określ pojemność pamięci operacyjnej oraz dysku."
  muted={!showMemory}
>
  {!showMemory && (
    <p className="text-sm opacity-70">
      Najpierw określ preferencje CPU/GPU.
    </p>
  )}

  {showMemory && (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* RAM – pojemność + liczba modułów */}
      {ram ? (
        // Mamy wybraną pojemność RAM → pokazujemy RAM + moduły w jednym rzędzie
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Pojemność RAM */}
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">
              Pamięć RAM (łączna pojemność)
            </div>
            <div className="flex flex-wrap gap-2">
              {RAM_OPTIONS.map((r) => (
                <TogglePill
                  key={r}
                  label={r}
                  active={ram === r}
                  onClick={() => {
                    setRam((prev) => (prev === r ? null : r));
                    // jak zmieniasz pojemność, to resetujemy liczbę modułów
                    setRamModules(null);
                    setStep(4);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Liczba modułów RAM */}
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">
              Liczba modułów RAM
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4].map((count) => (
                <TogglePill
                  key={count}
                  label={`${count} moduł${count > 1 ? "y" : ""}`}
                  active={ramModules === count}
                  onClick={() =>
                    setRamModules((prev) => (prev === count ? null : count))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Jeśli jeszcze NIE wybrano pojemności RAM → tylko wybór pojemności
        <div>
          <div className="text-sm font-medium mb-2">
            Pamięć RAM (łączna pojemność)
          </div>
          <div className="flex flex-wrap gap-2">
            {RAM_OPTIONS.map((r) => (
              <TogglePill
                key={r}
                label={r}
                active={ram === r}
                onClick={() => {
                  setRam((prev) => (prev === r ? null : r));
                  setRamModules(null);
                  setStep(4);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* DYSK – na razie klasyczny wybór (pojemność/konfiguracja) */}
      <div>
        <div className="text-sm font-medium mb-2">Dysk</div>
        <div className="flex flex-wrap gap-2">
          {STORAGE_OPTIONS.map((s) => (
            <TogglePill
              key={s}
              label={s}
              active={storage === s}
              onClick={() => {
                setStorage((prev) => (prev === s ? null : s));
                setStep(4);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )}
</Section>


          <Section
  title="4. Podzespoły"
  subtitle="Propozycje dobrane do wybranych preferencji."
  muted={!showParts}
>
  {!showParts && (
    <p className="text-sm opacity-70">
      Najpierw wybierz pamięć RAM i dysk.
    </p>
  )}

  {showParts && (
    <div className="mx-auto max-w-6xl">
      {/* DODATKOWE FILTRY: MOBO / PSU / CHŁODZENIE */}
      <div className="mx-auto max-w-5xl space-y-4 mb-6">
        {/* MOBO – WiFi */}
        <div>
          <div className="text-sm font-medium mb-2">
            Płyta główna – Wi-Fi
          </div>
          <div className="flex flex-wrap gap-2">
            <TogglePill
              label="Dowolnie"
              active={moboWifi === null}
              onClick={() => setMoboWifi(null)}
            />
            <TogglePill
              label="Z Wi-Fi"
              active={moboWifi === true}
              onClick={() =>
                setMoboWifi((prev) => (prev === true ? null : true))
              }
            />
            <TogglePill
              label="Bez Wi-Fi"
              active={moboWifi === false}
              onClick={() =>
                setMoboWifi((prev) => (prev === false ? null : false))
              }
            />
          </div>
        </div>

        {/* PSU – modularny */}
        <div>
          <div className="text-sm font-medium mb-2">
            Zasilacz – modularność
          </div>
          <div className="flex flex-wrap gap-2">
            <TogglePill
              label="Dowolny"
              active={psuModular === null}
              onClick={() => setPsuModular(null)}
            />
            <TogglePill
              label="Modularny"
              active={psuModular === true}
              onClick={() =>
                setPsuModular((prev) => (prev === true ? null : true))
              }
            />
            <TogglePill
              label="Niemodularny"
              active={psuModular === false}
              onClick={() =>
                setPsuModular((prev) => (prev === false ? null : false))
              }
            />
          </div>
        </div>

        {/* CHŁODZENIE – typ */}
        <div>
          <div className="text-sm font-medium mb-2">
            Chłodzenie procesora
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "air" as const, label: "Powietrzne" },
              { key: "aio" as const, label: "AIO" },
              { key: "water" as const, label: "Wodne (custom)" },
            ].map((c) => (
              <TogglePill
                key={c.key}
                label={c.label}
                active={coolerType === c.key}
                onClick={() =>
                  setCoolerType((prev) => (prev === c.key ? null : c.key))
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ISTNIEJĄCE REKOMENDACJE */}
      <BuilderRecommendations
        pcType={pcType}
        gpuFamily={gpuFamily}
        cpuVendor={cpuVendor}
        socket={socket}
        gpuVram={gpuVram}
        ram={ram}
        ramModules={ramModules}
        storage={storage}
        moboWifi={moboWifi}
        psuModular={psuModular}
        coolerType={coolerType}
        build={build}
        onPickPart={handlePickPart}
      />
    </div>
  )}
</Section>

          {/* 5. TWÓJ ZESTAW */}
         <Section
            title="5. Twój zestaw"
            subtitle="Podzespoły wybrane przez Ciebie."
          >
            {Object.keys(build).length === 0 && (
              <p className="opacity-70 text-sm">
                Nie wybrano jeszcze żadnych komponentów.
              </p>
            )}

            <div className="space-y-3 max-w-3xl">
              {Object.entries(build).map(([typ, produkt]) => (
                <div
                  key={typ}
                  className="flex justify-between items-center border px-4 py-3 rounded-lg"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <div className="font-medium">{produkt!.nazwa}</div>
                    <div className="opacity-60 text-xs">{typ}</div>
                  </div>

                  <button
                    className="text-xs px-3 py-1 rounded border"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => handleRemovePart(typ as TypProduktu)}
                  >
                    Usuń z zestawu
                  </button>
                </div>
              ))}
            </div>

  {Object.keys(build).length > 0 && (
  <div className="flex gap-3 mt-4">
    <button
      onClick={onCheckCompat}
      className="px-4 py-2 rounded text-sm"
      style={{ background: "var(--accent)", color: "#fff" }}
      disabled={checking}
    >
      {checking ? "Sprawdzam…" : "Sprawdź kompatybilność"}
    </button>

    <button
      onClick={onSaveSet}
      className="px-4 py-2 rounded border text-sm"
      style={{ borderColor: "var(--border)" }}
      disabled={!compat?.ok || saving}
    >
      {saving ? "Zapisuję…" : "Zapisz zestaw"}
    </button>

    <button
      onClick={handleClearBuild}
      className="px-4 py-2 rounded border text-sm"
      style={{ borderColor: "var(--border)" }}
    >
      Wyczyść zestaw
    </button>
  </div>
)}

{compat && (
  <div className="mt-3 rounded border p-3"
       style={{ borderColor:'var(--border)', background:'var(--surface)' }}>
    {compat.ok ? (
      <div className="text-sm">
        ✅ Zestaw jest kompatybilny.
        {compat.warnings?.length ? (
          <ul className="mt-2 list-disc ml-5 opacity-80">
            {compat.warnings.map((w, i) => (
              <li key={i}>⚠️ {w.message}</li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : (
      <div className="text-sm">
        ❌ Wykryto problemy z kompatybilnością:
        <ul className="mt-2 list-disc ml-5 text-red-400">
          {compat.issues.map((it, i) => (
            <li key={i}>{it.message}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}

{savedId !== null && (
  <div className="mt-3 text-sm rounded border px-3 py-2"
       style={{ borderColor:'var(--border)', background:'var(--surface)' }}>
    ✅ Zestaw zapisany (ID: <b>{savedId}</b>).
  </div>
)}

            {compatResult && (
              <div className="mt-4">
                {compatResult.compatible ? (
                  <p className="text-green-600 font-medium">
                    ✔ Zestaw jest w pełni kompatybilny!
                  </p>
                ) : (
                  <>
                    <p className="text-red-600 font-medium">
                      Wykryto błędy kompatybilności:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-500 mt-2">
                      {compatResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </Section>
        </main>
      </div>
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

function StepDot({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${
        active ? "" : "opacity-60"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full border ${
          active
            ? "bg-[var(--text)] border-[var(--text)]"
            : "bg-transparent border-[var(--border)]"
        }`}
      />
      <span className="text-xs md:text-sm">{label}</span>
    </button>
  );
}

function Section({
  title,
  subtitle,
  children,
  right,
  muted,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>

      {subtitle && <p className="text-sm opacity-70 mb-4">{subtitle}</p>}

      <div className={muted ? "opacity-60 pointer-events-none" : ""}>
        {children}
      </div>
    </section>
  );
}

function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected?: boolean;
  onClick?: () => void;
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-full text-left rounded-2xl border p-4 md:p-5 shadow-sm transition-all ${
        selected ? "ring-2 ring-[var(--accent)]" : ""
      }`}
      style={{
        background: "var(--surface)",
        borderColor: selected ? "var(--accent)" : "var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-xl border"
          style={{
            borderColor: selected ? "var(--accent)" : "var(--border)",
          }}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium">{title}</div>
          {description && (
            <div className="text-sm opacity-70 mt-1">{description}</div>
          )}
        </div>
      </div>
    </button>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? "active" : ""}`}
      style={{ cursor: "pointer" }}
    >
      {label}
    </button>
  );
}







