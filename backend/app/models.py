from sqlalchemy import Column, Integer, String, Numeric
from app.database import Base

class Product(Base):
    __tablename__ = "produkty"

    id_prod = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String(128), nullable=False)
    typ = Column(String(32), nullable=False)
    cena = Column(Numeric(10, 2), nullable=False)
