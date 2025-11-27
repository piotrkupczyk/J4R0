# app/routers/sets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/sets", tags=["sets"])

@router.post("/", response_model=schemas.SaveSetOut)
def save_set(body: schemas.SaveSetIn, db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Brak elementów zestawu.")

    # 1) Zapis nagłówka zestawu
    z = models.Zestaw(
        nazwa=body.nazwa or "Zestaw",
        id_klienta=body.id_klienta,      # może być None
        data_utworzenia=date.today(),
    )
    db.add(z)
    db.flush()                           # pobierz z.id_zestawu z sekwencji

    # 2) Zapis pozycji
    for it in body.items:
        db.add(models.ZestawyProdukty(
            id_zestawu=z.id_zestawu,
            id_prod=it.id,
            ilosc=it.ilosc or 1,
        ))

    db.commit()
    return schemas.SaveSetOut(id_zestawu=z.id_zestawu)
