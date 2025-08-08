from pydantic import BaseModel

class ProductBase(BaseModel):
    nazwa: str
    typ: str
    cena: float

class Product(ProductBase):
    id_prod: int

    class Config:
        orm_mode = True
