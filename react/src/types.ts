// types.ts — zgodne z nazwami pól z bazy/API (po polsku)

export type TypProduktu =
  | 'CPU'
  | 'GPU'
  | 'MOBO'
  | 'RAM'
  | 'PSU'
  | 'CASE'
  | 'DYSK'
  | 'COOLER';

// Pola wspólne dla każdego produktu
export interface ProduktBazowy {
  id: number;          // klucz główny
  typ: TypProduktu;    // kategoria
  nazwa: string;       // nazwa do wyświetlenia
  cena: number;        // cena w PLN (liczba w groszach lub zł — jak u Ciebie)
  producent?: string | null;
  opis?: string | null;
  // pozwala przechować dodatkowe atrybuty bez psucia typów:
  [k: string]: unknown;
}

// ----- CPU -----
export interface ProduktCPU extends ProduktBazowy {
  typ: 'CPU';
  socket?: string | null;
  rdzenie?: number | null;
  watki?: number | null;
  tdp?: number | null;               // W
  igpu?: string | null;             // np. "Intel UHD", "Radeon", albo null
}

// ----- GPU -----
export interface ProduktGPU extends ProduktBazowy {
  typ: 'GPU';
  chipset?: string | null;          // np. "RTX 4070", "RX 7800 XT"
  vram?: number | null;             // GB
  gddr?: string | null;             // np. "GDDR6"
  tdp?: number | null;              // W
  dlugosc?: number | null;          // mm
}

// ----- MOBO -----
export interface ProduktMOBO extends ProduktBazowy {
  typ: 'MOBO';
  socket?: string | null;
  ddr?: 'DDR3' | 'DDR4' | 'DDR5' | string | null;
  chipset?: string | null;          // np. "B650", "Z790"
  format?: string | null;           // np. "ATX", "mATX", "ITX"
  sloty_m2?: number | null;
}

// ----- RAM -----
export interface ProduktRAM extends ProduktBazowy {
  typ: 'RAM';
  ddr?: 'DDR3' | 'DDR4' | 'DDR5' | string | null;
  taktowanie?: number | null;       // MHz
  clock_latency?: number | null;    // CL
  pojemnosc_total?: number | null;  // GB całość
  liczba_modulow?: number | null;   // np. 2
  pojemnosc_modulu?: number | null; // GB na moduł
  rgb?: boolean | null;
  profil?: 0 | 1 | null;            // 0 = low profile, 1 = high profile
}

// ----- PSU -----
export interface ProduktPSU extends ProduktBazowy {
  typ: 'PSU';
  moc?: number | null;              // W
  certyfikat?: string | null;       // np. "80+ Gold"
  modularny?: boolean | null;
}

// ----- CASE -----
export interface ProduktCASE extends ProduktBazowy {
  typ: 'CASE';
  wysokosc?: number | null;         // mm
  dlugosc?: number | null;          // mm
  szerokosc?: number | null;        // mm
  ilosc_wentylatorow?: number | null;
  format?: string | null;           // ATX/mATX/ITX kompatybilność
  rgb?: boolean | null;
}

// ----- DYSK -----
export interface ProduktDYSK extends ProduktBazowy {
  typ: 'DYSK';
  interfejs?: string | null;        // "NVMe", "SATA"
  format?: string | null;           // np. "M.2 2280", "2.5\""
  pojemnosc_gb?: number | null;     // GB
  predkosc_odczytu?: number | null; // MB/s
  predkosc_zapisu?: number | null;  // MB/s
}

// ----- COOLER -----
export interface ProduktCOOLER extends ProduktBazowy {
  typ: 'COOLER';
  typ_coolera?: string | null;      // "powietrzny", "AIO", itp.
  wysokosc?: number | null;         // mm
  ilosc_wentylatorow?: number | null;
  sockety?: string[] | null;        // lista wspieranych socketów
  rgb?: boolean | null;
}

export type BuildItem = {
  typ: TypProduktu;
  id: number;
  ilosc: number;
};
export type CompatLevel = 'error' | 'warn';
export interface CompatIssue {
  level: CompatLevel;
  message: string;
}

export interface CompatResult {
  ok: boolean;
  issues: CompatIssue[];
  warnings: CompatIssue[];
}

export interface SaveSetOut {
  id_zestawu: number;
}


export type Produkt =
  | ProduktCPU
  | ProduktGPU
  | ProduktMOBO
  | ProduktRAM
  | ProduktPSU
  | ProduktCASE
  | ProduktDYSK
  | ProduktCOOLER;


// === kompatybilność / zapisywanie ===



