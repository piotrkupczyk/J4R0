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
    dual_bios = Column(CHAR(1))
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
    ma_cooler = Column(CHAR(1))
    podkrecanie = Column(CHAR(1))
    ma_integre = Column(CHAR(1))