import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";

const PC_TYPES = [
  { key: "office", label: "Biurowy", icon: "💼", desc: "Do pracy biurowej i nauki" },
  { key: "standard", label: "Standardowy", icon: "🧩", desc: "Uniwersalny do codziennych zadań" },
  { key: "gaming", label: "Gamingowy", icon: "🎮", desc: "Granie i wysoka wydajność" },
] as const;

const GPU_FAMILIES = [
  { key: "nvidia", label: "NVIDIA" },
  { key: "amd", label: "AMD" },
  { key: "intel", label: "Intel" },
] as const;

const CPU_VENDORS = [
  { key: "amd", label: "AMD" },
  { key: "intel", label: "Intel" },
] as const;

export default function PCBuilderPage() {
  const [step, setStep] = useState<number>(1);
  const [pcType, setPcType] = useState<string | null>(null);
  const [gpuFamily, setGpuFamily] = useState<string | null>(null);
  const [cpuVendor, setCpuVendor] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const resetFrom = (fromStep: number) => {
    if (fromStep <= 1) { setPcType(null); }
    if (fromStep <= 2) { setGpuFamily(null); setCpuVendor(null); }
  };

  const showVendors = !!pcType;
  const showParts = !!pcType && (!!gpuFamily || !!cpuVendor);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-7xl px-6">
        <header className="sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center gap-3 bg-transparent">
            <span className="text-lg">🛠️</span>
            <span className="font-semibold tracking-tight">Kreator PC</span>
            <Badge variant="secondary" className="ml-auto">Wersja: layout</Badge>
          </div>
        </header>

        <nav className="px-4 py-4">
          <ol className="mx-auto max-w-5xl flex items-center gap-4 text-sm justify-center">
            <StepDot active={step >= 1} label="Typ komputera" onClick={() => setStep(1)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 2} label="Preferencje GPU/CPU" onClick={() => step >= 2 && setStep(2)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 3} label="Podzespoły" onClick={() => step >= 3 && setStep(3)} />
            <span className="opacity-60">›</span>
            <StepDot active={step >= 4} label="Podsumowanie" onClick={() => step >= 4 && setStep(4)} />
          </ol>
        </nav>

        <main className="px-4 pb-8">
          {/* Sekcja 1 */}
          <Section
            title="1. Wybierz typ komputera"
            subtitle="Zacznijmy od ogólnego przeznaczenia — to ułatwi dalszy dobór."
            right={<ResetButton onClick={() => { resetFrom(1); setStep(1); }} disabled={!pcType} />}
          >
            <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-stretch items-stretch">
              {PC_TYPES.map(({ key, label, icon, desc }) => (
                <SelectableCard
                  key={key}
                  selected={pcType === key}
                  onClick={() => {
                    setPcType(key);
                    setStep(2);
                    setTimeout(() => scrollTo("section-vendors"), 0);
                  }}
                  icon={icon}
                  title={label}
                  description={desc}
                />
              ))}
            </div>
          </Section>

          {/* Sekcja 2 */}
          {showVendors && (
            <Section
              title="2. Preferencje producentów"
              subtitle="Na start wybierz rodzinę GPU i producenta CPU. To tylko preferencje — filtrują listę podzespołów."
              right={<ResetButton onClick={() => { resetFrom(2); setStep(2); }} disabled={!gpuFamily && !cpuVendor} />}
            >
              <div id="section-vendors" className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>GPU</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {GPU_FAMILIES.map(f => (
                        <TogglePill key={f.key} label={f.label} active={gpuFamily === f.key}
                          onClick={() => {
                            const next = gpuFamily === f.key ? null : f.key;
                            setGpuFamily(next);
                            if (pcType && (next || cpuVendor)) {
                              setStep(3);
                              setTimeout(() => scrollTo("section-parts"), 0);
                            }
                          }} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>CPU</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {CPU_VENDORS.map(v => (
                        <TogglePill key={v.key} label={v.label} active={cpuVendor === v.key}
                          onClick={() => {
                            const next = cpuVendor === v.key ? null : v.key;
                            setCpuVendor(next);
                            if (pcType && (gpuFamily || next)) {
                              setStep(3);
                              setTimeout(() => scrollTo("section-parts"), 0);
                            }
                          }} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Section>
          )}

          {/* Sekcja 3 */}
          {showParts && (
            <Section title="3. Podzespoły" subtitle="Placeholder list z filtrami. W kolejnym kroku podepniemy Twoje dane.">
              <div id="section-parts">
                <div className="mx-auto max-w-5xl mb-4 flex flex-wrap items-center gap-3 justify-center">
                  <Input placeholder="Szukaj w podzespołach (np. RTX 4070, B650, 32GB)"
                    value={query} onChange={e => setQuery(e.target.value)} className="max-w-md" />
                  <Badge variant="outline" className="capitalize">Typ: {pcType ?? "—"}</Badge>
                  <Badge variant="outline" className="capitalize">GPU: {gpuFamily ?? "—"}</Badge>
                  <Badge variant="outline" className="capitalize">CPU: {cpuVendor ?? "—"}</Badge>
                  <Badge variant="secondary" className="ml-auto">UI demo</Badge>
                </div>

                <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <PartsColumn title="Karty graficzne" hint="Filtrowane po: rodzina GPU" />
                  <PartsColumn title="Procesory" hint="Filtrowane po: producent CPU" />
                  <PartsColumn title="Płyty główne" hint="Automatycznie po gnieździe CPU (wkrótce)" />
                  <PartsColumn title="RAM" hint="Po typie i profilu (wkrótce)" />
                  <PartsColumn title="Dyski" hint="Po interfejsie (wkrótce)" />
                  <PartsColumn title="Chłodzenia" hint="Po TDP i sockecie (wkrótce)" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 justify-center">
                <Button variant="secondary" onClick={() => setStep(2)}>Wstecz</Button>
                <Button disabled>Podsumowanie (wkrótce)</Button>
              </div>
            </Section>
          )}

          {/* Sekcja 4 – zostaje do zaimplementowania po spięciu koszyka */}
        </main>
      </div>
    </div>
  );
}

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
        {selected && <Badge className="ml-auto">Wybrane</Badge>}
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

function PartsColumn({ title, hint }:{ title:string; hint?:string; }){
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {hint && <span className="text-xs opacity-70">{hint}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <SkeletonRow title="Przykładowy element 1" subtitle="Specyfikacja • placeholder" />
          <SkeletonRow title="Przykładowy element 2" subtitle="Specyfikacja • placeholder" />
          <SkeletonRow title="Przykładowy element 3" subtitle="Specyfikacja • placeholder" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonRow({ title, subtitle }:{ title:string; subtitle?:string; }){
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border hover:opacity-90"
      style={{ borderColor: "var(--border)", background: "color-mix(in oklab, var(--surface) 85%, transparent)" }}>
      <div className="h-10 w-10 rounded-lg" style={{ background: "color-mix(in oklab, var(--surface) 60%, transparent)" }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs opacity-70 truncate">{subtitle}</div>
      </div>
      <Button size="sm" variant="secondary">Wybierz</Button>
    </div>
  );
}

function ResetButton({ onClick, disabled }:{ onClick?: () => void; disabled?: boolean; }){
  return <Button size="sm" variant="ghost" onClick={onClick} disabled={disabled}>Reset</Button>;
}