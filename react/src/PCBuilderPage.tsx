import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import BuilderRecommendations from "./components/BuilderRecommendations";

const PC_TYPES = [
  { key: "office",   label: "Biurowy",    icon: "💼", desc: "Idealny do biura i nauki" },
  { key: "standard", label: "Standardowy",icon: "🧩", desc: "Niezbędny w codziennym użytkowaniu" },
  { key: "gaming",   label: "Gamingowy",  icon: "🎮", desc: "Dla wymagających użytkowników" },
] as const;

const GPU_FAMILIES = [
  { key: "nvidia", label: "Nvidia" },
  { key: "amd",    label: "AMD" },
  { key: "intel",  label: "Intel" },
] as const;

const CPU_VENDORS = [
  { key: "amd",   label: "AMD" },
  { key: "intel", label: "Intel" },
] as const;

// dostępne sockety per vendor
const SOCKETS_BY_VENDOR: Record<string, string[]> = {
  amd:   ["AM4", "AM5"],
  intel: ["LGA1700"],
};

// wybór VRAM (GB); null = dowolny
const VRAM_CHOICES: (number | null)[] = [null, 6, 8, 12, 16, 24];

/** rekomendowane zakresy RAM/Storage wg typu PC */
const RAM_BY_TYPE: Record<string, string[]> = {
  office:   ["8 GB", "16 GB", "32 GB"],
  standard: ["16 GB", "32 GB", "64 GB"],
  gaming:   ["32 GB", "64 GB", "128 GB", "256 GB"],
};
const STORAGE_BY_TYPE: Record<string, string[]> = {
  office:   ["256 GB SSD", "512 GB SSD", "1 TB SSD"],
  standard: ["1 TB SSD", "2 TB SSD"],
  gaming:   ["1 TB SSD", "2 TB SSD", "4 TB SSD"],
};

export default function PCBuilderPage() {
  const [step, setStep] = useState<number>(1);
  type PcType = 'office' | 'standard' | 'gaming';
  const [pcType, setPcType] = useState<PcType | null>(null);

  const [gpuFamily, setGpuFamily] = useState<string | null>(null);
  const [cpuVendor, setCpuVendor] = useState<string | null>(null);

  const [socket, setSocket]   = useState<string | null>(null);
  const [gpuVram, setGpuVram] = useState<number | null>(null);

  const [ram, setRam] = useState<string | null>(null);
  const [storage, setStorage] = useState<string | null>(null);

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

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const step2Label = isOffice ? "CPU (iGPU)" : "Preferencje GPU/CPU";
  const step3Label = "Pamięć";
  const step4Label = "Podzespoły";

  const RAM_OPTIONS = pcType ? RAM_BY_TYPE[pcType] ?? RAM_BY_TYPE.office : RAM_BY_TYPE.office;
  const STORAGE_OPTIONS = pcType ? STORAGE_BY_TYPE[pcType] ?? STORAGE_BY_TYPE.office : STORAGE_BY_TYPE.office;

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

        <main className="px-4 pb-8">
          {/* 1. Typ komputera */}
          <Section
            title="Wybierz spersonalizowany sprzęt do twoich potrzeb"
            subtitle="Zacznijmy od zastosowania. Do czego planujesz używać swojej maszyny?"
          >
            <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {PC_TYPES.map(({ key, label, icon, desc }) => (
                <SelectableCard
                  key={key}
                  selected={pcType === key}
                  onClick={() => {
                    const changed = pcType !== key;
                    setPcType(key);
                    setStep(2);
                    if (changed) setTimeout(() => scrollTo("section-step2"), 0);
                  }}
                  icon={icon}
                  title={label}
                  description={desc}
                />
              ))}
            </div>
          </Section>

          {/* 2. Preferencje / CPU-only dla biurowego */}
          {showVendors && (
            <Section
              title={`2. ${step2Label}`}
              subtitle={isOffice
                ? "Który producent jest bliżej twojego serca? Czerwoni czy Niebiescy?"
                : "Na początek wybierz producenta CPU i (opcjonalnie) rodzinę GPU."}
            >
              <div id="section-step2" className={`mx-auto ${isOffice ? "max-w-3xl" : "max-w-5xl"} grid grid-cols-1 ${isOffice ? "" : "md:grid-cols-2"} gap-6`}>
                {/* GPU (ukryte dla office) */}
                {!isOffice && (
                  <Card>
                    <CardHeader><CardTitle>GPU</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {GPU_FAMILIES.map(f => (
                          <TogglePill
                            key={f.key}
                            label={f.label}
                            active={gpuFamily === f.key}
                            onClick={() => {
                              const next = gpuFamily === f.key ? null : f.key;
                              setGpuFamily(next);
                              if ((isStandard || isGaming) && (next || cpuVendor)) {
                                setStep(3);
                                setTimeout(() => scrollTo("section-step3"), 0);
                              }
                            }}
                          />
                        ))}
                      </div>

                      {/* NOWE: VRAM */}
                      <div className="mt-4">
                        <div className="text-sm mb-2 opacity-70">Preferowany VRAM</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {VRAM_CHOICES.map(v => (
                            <TogglePill
                              key={String(v)}
                              label={v === null ? "Dowolny" : `${v} GB`}
                              active={gpuVram === v}
                              onClick={() => setGpuVram(gpuVram === v ? null : v)}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CPU */}
                <Card>
                  <CardHeader><CardTitle>{isOffice ? "Zintegrowana grafika" : "CPU"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {CPU_VENDORS.map(v => (
                        <TogglePill
                          key={v.key}
                          label={v.label}
                          active={cpuVendor === v.key}
                          onClick={() => {
                            const next = cpuVendor === v.key ? null : v.key;
                            setCpuVendor(next);
                            // reset socketu przy zmianie vendora
                            setSocket(null);
                            if (isOffice) {
                              if (next) { setStep(3); setTimeout(() => scrollTo("section-step3"), 0); }
                            } else {
                              if (gpuFamily || next) { setStep(3); setTimeout(() => scrollTo("section-step3"), 0); }
                            }
                          }}
                        />
                      ))}
                    </div>

                    {/* NOWE: socket – pojawia się po wyborze vendora */}
                    {cpuVendor && (
                      <div className="mt-4">
                        <div className="text-sm mb-2 opacity-70">Socket</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {SOCKETS_BY_VENDOR[cpuVendor]?.map(s => (
                            <TogglePill
                              key={s}
                              label={s}
                              active={socket === s}
                              onClick={() => setSocket(socket === s ? null : s)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </Section>
          )}

          {/* 3. Pamięć */}
          {showMemory && (
            <Section title={`3. ${step3Label}`} subtitle="Wybierz ilość RAM i dysk.">
              <div id="section-step3" className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Pamięć RAM</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {RAM_OPTIONS.map(opt => (
                        <TogglePill
                          key={opt}
                          label={opt}
                          active={ram === opt}
                          onClick={() => {
                            const next = ram === opt ? null : opt;
                            setRam(next);
                            if (next && storage) { setStep(4); setTimeout(() => scrollTo("section-parts"), 0); }
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Dysk / Storage</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {STORAGE_OPTIONS.map(opt => (
                        <TogglePill
                          key={opt}
                          label={opt}
                          active={storage === opt}
                          onClick={() => {
                            const next = storage === opt ? null : opt;
                            setStorage(next);
                            if (ram && next) { setStep(4); setTimeout(() => scrollTo("section-parts"), 0); }
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Section>
          )}

          {/* 4. Podzespoły */}
          {showParts && (
            <Section title={`4. Podzespoły`} subtitle="Propozycje dobrane do preferencji:">
              <div id="section-parts" className="mx-auto max-w-6xl">
                <BuilderRecommendations
                  pcType={pcType}
                  gpuFamily={gpuFamily}
                  cpuVendor={cpuVendor}
                  ram={ram}
                  storage={storage}
                  socket={socket}
                  gpuVram={gpuVram}
                />
              </div>
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}

/* --- UI helpers --- */
function StepDot({ active, label, onClick }:{ active?:boolean; label:string; onClick?: () => void; }){
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 ${active ? "" : "opacity-60"}`}>
      <span className={`h-2.5 w-2.5 rounded-full border ${active ? "bg-[var(--text)] border-[var(--text)]" : "bg-transparent border-[var(--border)]"}`} />
      <span className="text-xs md:text-sm">{label}</span>
    </button>
  );
}
function Section({ title, subtitle, children, right, muted }:{ title:string; subtitle?:string; children:React.ReactNode; right?:React.ReactNode; muted?:boolean }){
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
      {subtitle && <p className="text-sm opacity-70 mb-4">{subtitle}</p>}
      <div className={muted ? "opacity-60 pointer-events-none" : ""}>{children}</div>
    </section>
  );
}
function SelectableCard({ selected, onClick, icon, title, description }:{ selected?:boolean; onClick?:() => void; icon?:string; title:string; description?:string; }){
  return (
    <button onClick={onClick}
      className={`h-full text-left rounded-2xl border p-4 md:p-5 shadow-sm transition-all ${selected ? "ring-2 ring-[var(--accent)]" : ""}`}
      style={{ background: "var(--surface)", borderColor: selected ? "var(--accent)" : "var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl border" style={{ borderColor: selected ? "var(--accent)" : "var(--border)" }}>{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="text-sm opacity-70 mt-1">{description}</div>}
        </div>
      </div>
    </button>
  );
}
function TogglePill({ label, active, onClick }:{ label:string; active?:boolean; onClick?:() => void; }){
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full border transition ${active ? "text-white" : ""}`}
      style={{
        background: active ? "var(--accent)" : "transparent",
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "#fff" : "var(--text)"
      }}>
      {label}
    </button>
  );
}
