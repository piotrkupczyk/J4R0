# app/routers/gpus.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app import models, schemas


router = APIRouter(
    prefix="/gpus",
    tags=["gpus"]
)


# ---- Schematy pomocnicze (tylko na potrzeby tego routera) ----

class GPUCreateWithId(schemas.GPUBase):
    """Tworzenie rekordu GPU dla JUŻ ISTNIEJĄCEGO produktu (FK = id_gpu)."""
    id_gpu: int


class ProductGPUCreate(BaseModel):
    """Jednym requestem tworzysz produkt typu 'gpu' oraz rekord w 'gpu'."""
    id_prod: int
    nazwa: str
    cena: float
    # typ ustawimy w kodzie na 'gpu', żeby nie musieć przesyłać
    gpu: schemas.GPUBase


# ---------------------- Endpointy -------------------------------

@router.get("/", response_model=list[schemas.GPU])
def get_gpus(db: Session = Depends(get_db)):
    return db.query(models.GPU).all()


@router.get("/{id_gpu}", response_model=schemas.GPU)
def get_gpu(id_gpu: int, db: Session = Depends(get_db)):
    obj = db.get(models.GPU, id_gpu)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GPU not found")
    return obj


@router.post("/", response_model=schemas.GPU, status_code=status.HTTP_201_CREATED)
def create_gpu(body: GPUCreateWithId, db: Session = Depends(get_db)):
    """
    Tworzy rekord w tabeli 'gpu' dla istniejącego produktu (produkty.id_prod == body.id_gpu).
    Jeśli produkt nie istnieje, zwróci 404 (bo FK się wywali przy commit'cie).
    """
    # (opcjonalnie) sprawdź istnienie produktu, żeby dać 404 zamiast 500/409:
    if db.get(models.Product, body.id_gpu) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product (id_prod) not found")

    obj = models.GPU(id_gpu=body.id_gpu, **body.model_dump(exclude={"id_gpu"}))
    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except IntegrityError:
        db.rollback()
        # może oznaczać: GPU o tym id już istnieje lub brak produktu (FK)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="GPU already exists or FK violated")


@router.delete("/{id_gpu}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gpu(id_gpu: int, db: Session = Depends(get_db)):
    obj = db.get(models.GPU, id_gpu)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GPU not found")
    db.delete(obj)
    db.commit()
    return None


@router.post("/with-product", response_model=schemas.ProductWithGPU, status_code=status.HTTP_201_CREATED)
def create_product_with_gpu(payload: ProductGPUCreate, db: Session = Depends(get_db)):
    """
    Jednym requestem tworzy:
      1) rekord w 'produkty' (typ = 'gpu')
      2) powiązany rekord w 'gpu' (id_gpu = id_prod)

    Wszystko w jednej transakcji; jeśli coś pójdzie nie tak – rollback.
    """
    # sprawdź kolizję ID
    if db.get(models.Product, payload.id_prod) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product with this id_prod already exists")
    if db.get(models.GPU, payload.id_prod) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="GPU with this id already exists")

    product = models.Product(
        id_prod=payload.id_prod,
        nazwa=payload.nazwa,
        typ="gpu",         # wymuszamy spójność
        cena=payload.cena
    )
    gpu = models.GPU(
        id_gpu=payload.id_prod,
        **payload.gpu.model_dump()
    )

    try:
        db.add(product)
        db.add(gpu)
        db.commit()
        db.refresh(product)
        db.refresh(gpu)
        # sklejka pod schemat ProductWithGPU
        return {
            "id_prod": product.id_prod,
            "nazwa": product.nazwa,
            "typ": product.typ,
            "cena": float(product.cena),
            "gpu": gpu
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Constraint violation while creating product+gpu")
