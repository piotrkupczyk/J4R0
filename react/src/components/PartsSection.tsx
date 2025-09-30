import type { Produkt } from '../types';
import { fmtPL } from '../lib/api';

type Props = {
  title: string;
  items: Produkt[];
  onPick?: (p: Produkt) => void;
  subtitle?: string;
};

export function PartsSection({ title, items, subtitle, onPick }: Props) {
  return (
    <section className="box">
      <div className="box-head">
        <h3>{title}</h3>
        {subtitle ? <small className="muted">{subtitle}</small> : null}
      </div>

      {items.length === 0 ? (
        <div className="placeholder">Brak propozycji.</div>
      ) : (
        items.slice(0, 6).map((p) => (
          <div className="row part" key={`${p.typ}-${p.id}`}>
            <div className="col">
              <div className="name">{p.nazwa}</div>
              <div className="meta">
                {p.typ === 'GPU' && (
                  <span>{[p.chipset, p.vram && `${p.vram}GB`, p.gddr].filter(Boolean).join(', ')}</span>
                )}
                {p.typ === 'CPU' && (
                  <span>{[`Socket ${p.socket}`, p.rdzenie && `${p.rdzenie}C/${p.watki}T`, p.tdp && `${p.tdp}W`]
                    .filter(Boolean).join(', ')}</span>
                )}
                {p.typ === 'MOBO' && (
                  <span>{[`Socket ${p.socket}`, p.ddr && `DDR${p.ddr}`, p.format].filter(Boolean).join(', ')}</span>
                )}
                {/* dodawaj skrócone meta dla pozostałych typów */}
              </div>
            </div>
            <div className="col price">{fmtPL.format(p.cena)}</div>
            <div className="col">
              <button className="btn" onClick={() => onPick?.(p)}>Wybierz</button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
