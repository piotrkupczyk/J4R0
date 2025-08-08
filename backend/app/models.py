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