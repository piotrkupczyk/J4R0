from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.KlientOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.Klient).filter(models.Klient.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email już istnieje")

    klient = models.Klient(
        imie=body.imie,
        nazwisko=body.nazwisko,
        email=body.email,
        telefon=body.telefon,
        adres=body.adres,
        haslo=get_password_hash(body.password),
    )
    db.add(klient)
    db.commit()
    db.refresh(klient)
    return klient

@router.post("/login", response_model=schemas.KlientOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    klient = db.query(models.Klient).filter(models.Klient.email == body.email).first()
    if not klient or not verify_password(body.password, klient.haslo):
        raise HTTPException(status_code=400, detail="Nieprawidłowe dane logowania")
    return klient
