import React, { useState } from "react";
import BuilderRecommendations from "./components/BuilderRecommendations";
import type { Produkt, TypProduktu } from "./types";

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
  const [ram, setRam] = useState<string | null>(null);              // np. '16 GB', '32 GB'
  const [storage, setStorage] = useState<string | null>(null);  
  const [step, setStep] = useState(1);    // np. '512 GB', '1 TB'

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

  const handleCheckCompatibility = async () => {
    try {
      const res = await fetch("/api/builder/check");
      if (!res.ok) {
        setCompatResult({
          compatible: false,
          errors: ["Nie udało się sprawdzić kompatybilności (błąd serwera)."],
        });
        return;
      }
      const data = await res.json();
      setCompatResult({
        compatible: !!data.compatible,
        errors: data.errors ?? [],
      });
    } catch (e) {
      setCompatResult({
        compatible: false,
        errors: ["Nie udało się połączyć z backendem."],
      });
    }
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
                      setStorage(null);
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
                <div>
                  <div className="text-sm font-medium mb-2">Producent karty graficznej</div>
                  <div className="flex flex-wrap gap-2">
                    {GPU_FAMILIES.map((g) => (
                      <TogglePill
                        key={g.key}
                        label={g.label}
                        active={gpuFamily === g.key}
                        onClick={() => {
                          setGpuFamily(prev => (prev === g.key ? null : g.key));
                          setStep(3);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Producent procesora</div>
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

                {cpuVendor && (
                  <div>
                    <div className="text-sm font-medium mb-2">Socket procesora</div>
                    <div className="flex flex-wrap gap-2">
                      {(SOCKETS_BY_VENDOR[cpuVendor] ?? []).map((s) => (
                        <TogglePill
                          key={s}
                          label={s}
                          active={socket === s}
                          onClick={() => setSocket(prev => (prev === s ? null : s))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!isOffice && (
                  <div>
                    <div className="text-sm font-medium mb-2">Minimalna pamięć VRAM karty graficznej</div>
                    <div className="flex flex-wrap gap-2">
                      {VRAM_CHOICES.map((v) => (
                        <TogglePill
                          key={v ?? "any"}
                          label={v == null ? "Dowolna" : `${v} GB`}
                          active={gpuVram === v}
                          onClick={() => setGpuVram(prev => (prev === v ? null : v))}
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
            subtitle="Wybierz ilość pamięci RAM oraz pojemność dysku."
            muted={!showMemory}
          >
            {!showMemory && (
              <p className="text-sm opacity-70">
                Najpierw określ preferencje CPU/GPU.
              </p>
            )}

            {showMemory && (
              <div className="mx-auto max-w-5xl space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Pamięć RAM</div>
                  <div className="flex flex-wrap gap-2">
                    {RAM_OPTIONS.map((r) => (
                      <TogglePill
                        key={r}
                        label={r}
                        active={ram === r}
                        onClick={() => {
                          setRam(prev => (prev === r ? null : r));
                          setStep(4);
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Dysk</div>
                  <div className="flex flex-wrap gap-2">
                    {STORAGE_OPTIONS.map((s) => (
                      <TogglePill
                        key={s}
                        label={s}
                        active={storage === s}
                        onClick={() => {
                          setStorage(prev => (prev === s ? null : s));
                          setStep(4);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* 4. Podzespoły (propozycje) */}
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
                <BuilderRecommendations
                  pcType={pcType}
                  gpuFamily={gpuFamily}
                  cpuVendor={cpuVendor}
                  ram={ram}
                  storage={storage}
                  socket={socket}
                  gpuVram={gpuVram}
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
                  onClick={handleCheckCompatibility}
                  className="px-4 py-2 rounded text-sm"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Sprawdź kompatybilność
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
