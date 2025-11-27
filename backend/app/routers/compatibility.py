# app/routers/compatibility.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from app.compatibility import check_build_compatibility

router = APIRouter(prefix="/compat", tags=["compat"])

@router.post("/check", response_model=schemas.CompatResult)
def check_compat(body: schemas.SaveSetIn, db: Session = Depends(get_db)):
    """
    Odbiera:
    {
      "items": [
        {"typ":"CPU","id":1,"ilosc":1},
        {"typ":"MOBO","id":2,"ilosc":1}
      ],
      "nazwa": null,
      "id_klienta": null
    }
    Zwraca: CompatResult { ok, issues[], warnings[] }
    """
    return check_build_compatibility(body.items or [], db)
