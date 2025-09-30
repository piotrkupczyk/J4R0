import React, { useMemo, useState } from 'react';

import useCatalog from '../hooks/useCatalog';
import type { Produkt} from '../types';  
import { fmtPL } from '../lib/api';

function metaFor(p: Produkt) {            
  switch (p.typ) {
    case 'CPU':
      return [
        `Socket ${p.socket ?? '?'}`,
        p.tdp ? `TDP ${p.tdp}W` : null,
        p.rdzenie && p.watki ? `${p.rdzenie}/${p.watki} rd/wą` : null,
      ].filter(Boolean).join(', ');
    case 'GPU':
      return [
        p.chipset,
        p.vram ? `${p.vram}GB ${p.gddr ?? ''}`.trim() : null,
        p.tdp ? `TDP ${p.tdp}W` : null,
        p.dlugosc ? `${p.dlugosc}mm` : null,
      ].filter(Boolean).join(', ');
    case 'MOBO':
      return [`Socket ${p.socket ?? '?'}`, p.ddr ? `RAM ${p.ddr}` : null]
        .filter(Boolean).join(', ');
    case 'RAM':
      return [
        p.pojemnosc_total ? `${p.pojemnosc_total}GB` : null,
        p.liczba_modulow ? `${p.liczba_modulow}×${p.pojemnosc_modulu}GB` : null,
        p.taktowanie ? `${p.taktowanie} MHz` : null,
        p.clock_latency ? `CL${p.clock_latency}` : null,
        p.ddr ?? null,
      ].filter(Boolean).join(', ');
    case 'PSU':
      return p.moc ? `${p.moc}W` : '';
    case 'CASE':
      return p.wysokosc ? `Wys ${p.wysokosc}mm` : '';
    case 'DYSK':
      return `${p.interfejs} ${p.pojemnosc_gb}GB`;
    case 'COOLER':
      return [
        p.typ_coolera ?? null,
        p.wysokosc ? `${p.wysokosc}mm` : null,
        p.ilosc_wentylatorow ? `${p.ilosc_wentylatorow}x fan` : null,
        p.sockety?.length ? `Sockety: ${p.sockety.join('/')}` : null,
        p.rgb ? 'RGB' : null,
      ].filter(Boolean).join(', ');
    default:
      return '';
  }
}

export const ProductsGrid: React.FC = () => {
  const { items} = useCatalog(); 

  const [filter, setFilter] = useState<'all' | Produkt['typ']>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return items.filter(p => {                    
      const okType = filter === 'all' || p.typ === filter;
      const okQ = !q || `${p.nazwa} ${p.typ}`.toLowerCase().includes(q.toLowerCase());
      return okType && okQ;
    });
  }, [items, filter, q]);

  const types: Produkt['typ'][] = ['CPU','GPU','MOBO','RAM','PSU','CASE','DYSK','COOLER'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Wszystko</button>
        {types.map(t => (
          <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>
        ))}
        <input
          placeholder="Szukaj…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginLeft: 'auto', padding: '8px 10px' }}
        />
      </div>

      <div className="grid">
        {filtered.map(p => (                       
          <div key={`${p.typ}-${p.id}`} className="card">
            <div className="title">{p.nazwa}</div>
            <div className="muted">{p.typ}</div>
            <div className="meta">{metaFor(p)}</div>
            <div className="price">{fmtPL.format(p.cena)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
