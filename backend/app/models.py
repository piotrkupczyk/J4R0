from sqlalchemy import Column, Integer, String, SmallInteger, Numeric, Date, ForeignKey, UniqueConstraint, Table, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

from datetime import datetime
from datetime import date


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

##############################################################

cooler_socket = Table(
    "cooler_socket",
    Base.metadata,
    Column("id_cooler", Integer, ForeignKey("cooler.id_cooler", ondelete="CASCADE"), primary_key=True),
    Column("id_socket", Integer, ForeignKey("socket.id_socket", ondelete="CASCADE"), primary_key=True),
)

class Socket(Base):
    __tablename__ = "socket"

    id_socket = Column(Integer, primary_key=True, index=True)
    kod = Column(String(16), unique=True, nullable=False)   
    vendor = Column(String(16))

    coolers = relationship(
        "Cooler",
        secondary=cooler_socket,
        back_populates="sockets",
    )

class Cooler(Base):
    __tablename__ = "cooler"

    id_cooler = Column(Integer, primary_key=True, index=True)
    wysokosc = Column(SmallInteger)
    typ = Column(String(16))
    ilosc_wentylatorow = Column(SmallInteger)
    rgb = Column(SmallInteger)
    profil = Column(SmallInteger)

    sockets = relationship(
        "Socket",
        secondary=cooler_socket,
        back_populates="coolers",
    )
########################################################################

class Psu(Base):
    __tablename__ = "psu"

    id_psu = Column(Integer, primary_key=True, index=True)
    moc = Column(SmallInteger)
    format = Column(String(3))
    modularnosc = Column(SmallInteger)  # 0/1
    certyfikat = Column(String(10))


class PCCase(Base):
    __tablename__ = "pc_case"  

    id_case = Column(Integer, primary_key=True, index=True)
    format = Column(String(10))
    wysokosc = Column(SmallInteger)
    dlugosc = Column(SmallInteger)      
    szerokosc = Column(SmallInteger)
    ilosc_wentylatorow = Column(SmallInteger)


class Dysk(Base):
    __tablename__ = "dysk"

    id_dysk = Column(Integer, primary_key=True, index=True)
    typ = Column(String(5))             
    interfejs = Column(String(12))     
    format = Column(String(12))         
    pojemnosc_gb = Column(SmallInteger)
    predkosc_zapisu = Column(SmallInteger)   
    predkosc_odczytu = Column(SmallInteger)  



class Koszyk(Base):
    __tablename__ = "koszyk"
    id_koszyka        = Column(Integer, primary_key=True, index=True)
    nazwa             = Column(String(64), nullable=False, default="Koszyk")
    id_klienta        = Column(Integer, nullable=True)  # nullable dopoki nie bedzie userow
    data_utworzenia   = Column(Date, default=date.today)
    data_aktualizacji = Column(Date, default=date.today, onupdate=date.today)

    pozycje = relationship("KoszykPozycja",
                           back_populates="koszyk",
                           cascade="all, delete-orphan")

class KoszykPozycja(Base):
    __tablename__ = "koszyk_produkty"
    koszyk_id_koszyka = Column(Integer, ForeignKey("koszyk.id_koszyka"), primary_key=True)
    produkty_id_prod  = Column(Integer, ForeignKey("produkty.id_prod"), primary_key=True)
    ilosc = Column(SmallInteger, nullable=False, default=1)

    koszyk   = relationship("Koszyk", back_populates="pozycje")
    produkt  = relationship("Product")  


class Klient(Base):
    __tablename__ = "klienci"

    id_klienta = Column(Integer, primary_key=True, index=True, autoincrement=True)
    imie        = Column(String(64), nullable=True)
    nazwisko    = Column(String(64), nullable=True)
    email       = Column(String(128), nullable=False, unique=True, index=True)
    telefon     = Column(String(20), nullable=True)
    adres       = Column(String(255), nullable=True)
    data_dolaczenia = Column(Date, server_default=func.current_date())
    haslo       = Column(String(256), nullable=False)

