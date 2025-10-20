from pydantic import BaseModel, Field, EmailStr
from datetime import date
from typing import List, Optional

class ProductBase(BaseModel):
    nazwa: str
    typ: str
    cena: float

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id_prod: int

    class Config:
        from_attributes = True

###########################
#gpu
###########################

class GPUBase(BaseModel):
    chipset: str | None = None
    vram: int | None = None
    gddr: str | None = None
    tdp: int | None = None
    sloty_obudowy: float | None = None
    ilosc_wiatrakow: int | None = None
    dlugosc: int | None = None
    dual_bios: bool | None = None
    ilosc_hdmi: int | None = None
    ilosc_dp: int | None = None

class GPUCreate(GPUBase):
    pass

class GPU(GPUBase):
    id_gpu: int

    class Config:
        from_attributes = True


class ProductWithGPU(Product):
    gpu: GPU | None = None

###########################
#cooler
###########################
class SocketOut(BaseModel):
    id_socket: int
    kod: str
    vendor: Optional[str] = None
    class Config:
        from_attributes = True  

class SocketBase(BaseModel):
    kod: str
    vendor: str | None = None


class CoolerOut(BaseModel):
    id_cooler: int
    wysokosc: Optional[int] = None
    typ: Optional[str] = None
    ilosc_wentylatorow: Optional[int] = None
    rgb: Optional[str] = None
    profil: Optional[str] = None
    sockets: Optional[List[SocketOut]] = None
    class Config: from_attributes = True


class SocketCreate(SocketBase):
    pass


###########################
#koszyk
###########################

class CartCreate(BaseModel):
    nazwa: str = "Koszyk"
    id_klienta: int | None = None

class CartItemIn(BaseModel):
    product_id: int
    ilosc: int = Field(gt=0)

class CartItemOut(BaseModel):
    product_id: int
    nazwa: str
    typ: str
    cena: float
    ilosc: int
    suma: float

class CartOut(BaseModel):
    id_koszyka: int
    nazwa: str
    items: list[CartItemOut]
    total: float
    class Config: from_attributes = True

class Cart(BaseModel):
    id_koszyka: int
    nazwa: str
    id_klienta: int | None
    data_utworzenia: date
    data_aktualizacji: date
    class Config:
        from_attributes = True

class CartItemCreate(BaseModel):
    produkty_id_prod: int
    ilosc: int = 1

class CartItem(BaseModel):        
    koszyk_id_koszyka: int
    produkty_id_prod: int
    ilosc: int
    class Config:
        from_attributes = True



class KlientBase(BaseModel):
    imie: str | None = None
    nazwisko: str | None = None
    email: EmailStr
    telefon: str | None = None
    adres: str | None = None

class KlientCreate(KlientBase):
    password: str = Field(min_length=8, max_length=512)

class KlientOut(BaseModel):
    id_klienta: int
    imie: str | None
    nazwisko: str | None
    email: EmailStr
    telefon: str | None
    adres: str | None
    data_dolaczenia: date

    class Config:
        from_attributes = True 

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    
    name: Optional[str] = None
    imie: Optional[str] = None
    nazwisko: Optional[str] = None
    email: EmailStr
    telefon: Optional[str] = None
    adres: Optional[str] = None
    password: str = Field(min_length=8)

class RegisterIn(BaseModel):
    imie: str | None = None
    nazwisko: str | None = None
    email: EmailStr
    telefon: str | None = Field(default=None, min_length=7, max_length=20)
    adres: str | None = None
    password: str = Field(min_length=8, max_length=128)