from pydantic import BaseModel, Field
from datetime import date

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



#koszyk

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