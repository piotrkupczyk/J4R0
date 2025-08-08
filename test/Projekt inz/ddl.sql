CREATE TABLE "case" (
    id_case SERIAL PRIMARY KEY,
    format VARCHAR(10),
    wysokosc SMALLINT,
    dlugosc SMALLINT,
    szerokosc SMALLINT,
    ilosc_wentylatorow SMALLINT
);

CREATE TABLE cooler (
    id_cooler SERIAL PRIMARY KEY,
    wysokosc SMALLINT,
    typ VARCHAR(16),
    ilosc_wentylatorow SMALLINT,
    kompatybilne_sockety TEXT,
    rgb CHAR(1),
    profil CHAR(1)
);

CREATE TABLE cpu (
    id_cpu SERIAL PRIMARY KEY,
    socket VARCHAR(8),
    rdzenie SMALLINT,
    watki SMALLINT,
    zegar NUMERIC(5, 2),
    ddr VARCHAR(4),
    tdp SMALLINT,
    ma_cooler CHAR(1),
    podkrecanie CHAR(1)
);

CREATE TABLE dysk (
    id_dysk SERIAL PRIMARY KEY,
    typ VARCHAR(5),
    interfejs VARCHAR(12),
    format VARCHAR(12),
    pojemnosc_gb SMALLINT,
    predkosc_zapisu SMALLINT,
    predkosc_odczytu SMALLINT
);

CREATE TABLE gpu (
    id_gpu SERIAL PRIMARY KEY,
    chipset VARCHAR(6),
    vram SMALLINT,
    gddr VARCHAR(5),
    tdp SMALLINT,
    sloty_obudowy NUMERIC(3, 1),
    ilosc_wiatrakow SMALLINT,
    dlugosc SMALLINT,
    dual_bios CHAR(1),
    ilosc_hdmi SMALLINT,
    ilosc_dp SMALLINT
);

CREATE TABLE klienci (
    id_klienta SERIAL PRIMARY KEY,
    imie VARCHAR(64),
    nazwisko VARCHAR(64),
    email VARCHAR(128),
    telefon VARCHAR(20),
    adres VARCHAR(255),
    data_dolaczenia DATE,
    haslo VARCHAR(256)
);

CREATE TABLE koszyk (
    id_koszyka SERIAL PRIMARY KEY,
    nazwa VARCHAR(64),
    id_klienta INTEGER NOT NULL,
    data_utworzenia DATE,
    data_aktualizacji DATE,
    FOREIGN KEY (id_klienta) REFERENCES klienci(id_klienta)
);

CREATE TABLE koszyk_produkty (
    koszyk_id_koszyka INTEGER NOT NULL,
    produkty_id_prod INTEGER NOT NULL,
    ilosc SMALLINT,
    PRIMARY KEY (koszyk_id_koszyka, produkty_id_prod),
    FOREIGN KEY (koszyk_id_koszyka) REFERENCES koszyk(id_koszyka),
    FOREIGN KEY (produkty_id_prod) REFERENCES produkty(id_prod)
);

CREATE TABLE mobo (
    id_mobo SERIAL PRIMARY KEY,
    socket VARCHAR(8),
    ddr VARCHAR(4),
    format VARCHAR(10),
    max_ram SMALLINT,
    ilosc_slotow_ram SMALLINT,
    ilosc_slotow_m2 SMALLINT,
    ilosc_pcie_x16 SMALLINT,
    ilosc_pcie_x1 SMALLINT,
    ilosc_usb_3_0 SMALLINT,
    wifi CHAR(1),
    ilosc_usb_2_0 SMALLINT,
    ilosc_usb_c SMALLINT,
    bluetooth CHAR(1),
    bios_typ VARCHAR(10),
    podkrecanie CHAR(1)
);

CREATE TABLE produkty (
    id_prod SERIAL PRIMARY KEY,
    nazwa VARCHAR(128),
    typ VARCHAR(32),
    cena NUMERIC(7, 2)
);

CREATE TABLE psu (
    id_psu SERIAL PRIMARY KEY,
    moc SMALLINT,
    format VARCHAR(3),
    modularnosc CHAR(1),
    certyfikat VARCHAR(10)
);

CREATE TABLE ram (
    id_ram SERIAL PRIMARY KEY,
    pojemnosc_total SMALLINT,
    liczba_modulow SMALLINT,
    pojemnosc_modulu SMALLINT,
    taktowanie SMALLINT,
    clock_latency SMALLINT,
    ddr VARCHAR(4),
    profil CHAR(1)
);

CREATE TABLE zamowienia (
    id_zamowienia SERIAL PRIMARY KEY,
    id_klienta INTEGER NOT NULL,
    data_zlozenia DATE,
    data_zakonczenia DATE,
    status VARCHAR(20),
    adres_dostawy VARCHAR(255),
    uwagi TEXT,
    FOREIGN KEY (id_klienta) REFERENCES klienci(id_klienta)
);

CREATE TABLE zamowienia_produkty (
    id_zamowienia INTEGER NOT NULL,
    id_prod INTEGER NOT NULL,
    ilosc SMALLINT,
    PRIMARY KEY (id_zamowienia, id_prod),
    FOREIGN KEY (id_zamowienia) REFERENCES zamowienia(id_zamowienia),
    FOREIGN KEY (id_prod) REFERENCES produkty(id_prod)
);

CREATE TABLE zestawy (
    id_zestawu SERIAL PRIMARY KEY,
    nazwa VARCHAR(64),
    id_klienta INTEGER NOT NULL,
    data_utworzenia DATE,
    FOREIGN KEY (id_klienta) REFERENCES klienci(id_klienta) ON DELETE CASCADE
);

CREATE TABLE zestawy_produkty (
    id_prod INTEGER NOT NULL,
    id_zestawu INTEGER NOT NULL,
    ilosc SMALLINT,
    PRIMARY KEY (id_prod, id_zestawu),
    FOREIGN KEY (id_prod) REFERENCES produkty(id_prod),
    FOREIGN KEY (id_zestawu) REFERENCES zestawy(id_zestawu)
);

-- Powiązania produktów z komponentami:
ALTER TABLE cooler
    ADD CONSTRAINT cooler_produkty_fk FOREIGN KEY (id_cooler) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE dysk
    ADD CONSTRAINT dysk_produkty_fk FOREIGN KEY (id_dysk) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE gpu
    ADD CONSTRAINT gpu_produkty_fk FOREIGN KEY (id_gpu) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE cpu
    ADD CONSTRAINT cpu_produkty_fk FOREIGN KEY (id_cpu) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE mobo
    ADD CONSTRAINT mobo_produkty_fk FOREIGN KEY (id_mobo) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE "case"
    ADD CONSTRAINT obudowa_produkty_fk FOREIGN KEY (id_case) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE psu
    ADD CONSTRAINT psu_produkty_fk FOREIGN KEY (id_psu) REFERENCES produkty(id_prod) ON DELETE CASCADE;

ALTER TABLE ram
    ADD CONSTRAINT ram_produkty_fk FOREIGN KEY (id_ram) REFERENCES produkty(id_prod) ON DELETE CASCADE;
