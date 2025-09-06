from sqlalchemy import Column, Integer, String, SmallInteger, Numeric, CHAR

from app.database import Base

class Product(Base):
    __tablename__ = "produkty"

    id_prod = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String(128), nullable=False)
    typ = Column(String(32), nullable=False)
    cena = Column(Numeric(10, 2), nullable=False)

class GPU(Base):
    __tablename__ = "gpu"

    id_gpu = Column(Integer, primary_key=True, index=True)
    chipset = Column(String(6))
    vram = Column(SmallInteger)
    gddr = Column(String(5))
    tdp = Column(SmallInteger)
    sloty_obudowy = Column(Numeric(2, 1))
    ilosc_wiatrakow = Column(SmallInteger)
    dlugosc = Column(SmallInteger)
    dual_bios = Column(SmallInteger) # 0/1
    ilosc_hdmi = Column(SmallInteger)
    ilosc_dp = Column(SmallInteger)


class CPU(Base):
    __tablename__ = "cpu"

    id_cpu = Column(Integer, primary_key=True, index=True)
    socket = Column(String(8))
    rdzenie = Column(SmallInteger)
    watki = Column(SmallInteger)
    zegar = Column(SmallInteger)
    tdp = Column(SmallInteger)
    ma_cooler = Column(SmallInteger) # 0/1
    podkrecanie = Column(SmallInteger) # 0/1
    ma_integre = Column(SmallInteger) # 0/1



class Mobo(Base):
    __tablename__ = "mobo"

    id_mobo = Column(Integer, primary_key=True, index=True)
    socket = Column(String(8))
    ddr = Column(String(4))
    format = Column(String(10))
    max_ram = Column(SmallInteger)
    ilosc_slotow_ram = Column(SmallInteger)
    ilosc_slotow_m2 = Column(SmallInteger)
    ilosc_pcie_x16 = Column(SmallInteger)
    ilosc_pcie_x1 = Column(SmallInteger)
    ilosc_usb_3_0 = Column(SmallInteger)
    ilosc_usb_2_0 = Column(SmallInteger)
    ilosc_usb_c = Column(SmallInteger)
    wifi = Column(SmallInteger)         # 0/1
    bluetooth = Column(SmallInteger)    # 0/1
    bios_typ = Column(String(10))
    podkrecanie = Column(SmallInteger)  # 0/1

class Ram(Base):
    __tablename__ = "ram"

    id_ram = Column(Integer, primary_key=True, index=True)
    pojemnosc_total = Column(SmallInteger)
    liczba_modulow = Column(SmallInteger)
    pojemnosc_modulu = Column(SmallInteger)
    taktowanie = Column(SmallInteger)
    clock_latency = Column(SmallInteger)
    ddr = Column(String(4))
    profil = Column(SmallInteger)   # 0/1 

