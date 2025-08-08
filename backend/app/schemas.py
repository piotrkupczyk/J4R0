from pydantic import BaseModel

class ProductBase(BaseModel):
    nazwa: str
    typ: str
    cena: float

class Product(ProductBase):
    id_prod: int

    class Config:
        from_attributes = True


from pydantic import BaseModel

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

class GPU(GPUBase):
    id_gpu: int
    class Config:
        from_attributes = True
