// src/hooks/useCatalog.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Produkt } from '../types';

// 🔁 Mapowanie pól z backendu na nasze spójne, polskie nazwy
function adaptApiProdukt(api: any): Produkt {
  const wspolne = {
    id: api.id,
    typ: api.typ,
    nazwa: api.nazwa,
    cena: api.cena,
  };

  switch (api.typ) {
    case 'CPU':
      return {
        ...wspolne, typ: 'CPU',
        socket: api.socket ?? api.cpu_socket ?? null,
        rdzenie: api.rdzenie ?? api.cores ?? null,
        watki: api.watki ?? api.threads ?? null,
        tdp: api.tdp ?? null,
        // aliasy często spotykane:
        zegar: api.zegar ?? api.clock_mhz ?? null,
        integra: api.integra ?? api.igpu ?? null,
        cooler: api.cooler ?? null,
        oc: api.oc ?? null,
      } as Produkt;

    case 'GPU':
      return {
        ...wspolne, typ: 'GPU',
        chipset: api.chipset ?? null,
        vram: api.vram ?? api.vram_gb ?? null,
        gddr: api.gddr ?? null,
        tdp: api.tdp ?? null,
        dlugosc: api.dlugosc ?? api.length_mm ?? null,
        hdmi: api.hdmi ?? null,
        dp: api.dp ?? api.displayport ?? null,
        dual_bios: api.dual_bios ?? null,
      } as Produkt;

    case 'MOBO':
      return {
        ...wspolne, typ: 'MOBO',
        socket: api.socket ?? null,
        ddr: api.ddr ?? null,
        chipset: api.chipset ?? null,
        format: api.format ?? null,
        sloty_m2: api.sloty_m2 ?? api.m2_slots ?? null,
      } as Produkt;

    case 'RAM':
      return {
        ...wspolne, typ: 'RAM',
        ddr: api.ddr ?? null,
        taktowanie: api.taktowanie ?? api.mhz ?? null,
        clock_latency: api.clock_latency ?? api.cl ?? null,
        pojemnosc_total: api.pojemnosc_total ?? api.capacity_gb ?? null,
        liczba_modulow: api.liczba_modulow ?? api.modules ?? null,
        pojemnosc_modulu: api.pojemnosc_modulu ?? null,
        rgb: api.rgb ?? null,
        profil: api.profil ?? null, // 0=low,1=high
      } as Produkt;

    case 'PSU':
      return {
        ...wspolne, typ: 'PSU',
        moc: api.moc ?? api.wattage ?? null,
        certyfikat: api.certyfikat ?? api.cert ?? null,
        modularnosc: api.modularnosc ?? api.modularity ?? null,
        format: api.format ?? null,
      } as Produkt;

    case 'CASE':
      return {
        ...wspolne, typ: 'CASE',
        wysokosc: api.wysokosc ?? api.height_mm ?? null,
        dlugosc: api.dlugosc ?? api.length_mm ?? null,
        szerokosc: api.szerokosc ?? api.width_mm ?? null,
        ilosc_wentylatorow: api.ilosc_wentylatorow ?? null,
        format: api.format ?? null,
        rgb: api.rgb ?? null,
      } as Produkt;

    case 'DYSK':
      return {
        ...wspolne, typ: 'DYSK',
        interfejs: api.interfejs ?? api.interface ?? null,
        format: api.format ?? null,
        pojemnosc_gb: api.pojemnosc_gb ?? api.capacity_gb ?? null,
        predkosc_odczytu: api.predkosc_odczytu ?? api.read_speed ?? null,
        predkosc_zapisu: api.predkosc_zapisu ?? api.write_speed ?? null,
      } as Produkt;

    case 'COOLER':
      return {
        ...wspolne, typ: 'COOLER',
        typ_coolera: api.typ_coolera ?? api.cooler_type ?? null,
        wysokosc: api.wysokosc ?? api.height_mm ?? null,
        ilosc_wentylatorow: api.ilosc_wentylatorow ?? null,
        sockety: api.sockety ?? api.sockets ?? null,
        rgb: api.rgb ?? null,
        profil: api.profil ?? null,
      } as Produkt;

    default:
      // Jeśli wpadnie coś nowego – zostaw podstawy, żeby UI się nie wywalił
      return wspolne as Produkt;
  }
}

type State =
  | { loading: true; items: Produkt[]; error: null }
  | { loading: false; items: Produkt[]; error: string | null };

export default function useCatalog(endpoint = '/api/katalog') {
  const [state, setState] = useState<State>({ loading: true, items: [], error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const res = await fetch(endpoint, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        // Obsługa zarówno tablicy, jak i obiektu z polem "items"
        const list: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
        const items = list.map(adaptApiProdukt).filter(Boolean) as Produkt[];

        if (mounted.current) setState({ loading: false, items, error: null });
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        if (mounted.current) setState({ loading: false, items: [], error: e?.message ?? 'Błąd pobierania' });
      }
    })();

    return () => {
      mounted.current = false;
      ctrl.abort();
    };
  }, [endpoint]);

  // Stabilny shape dla siatki produktów
  const value = useMemo(() => ({
    items: state.items,
    loading: state.loading,
    error: state.error,
  }), [state.items, state.loading, state.error]);

  return value;
}
