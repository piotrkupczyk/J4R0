# app/routers/builder.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from app.compatibility import check_build_compatibility

router = APIRouter(prefix="/builder", tags=["builder"])

@router.post("/check", response_model=schemas.CompatResult)
def check_build(body: schemas.SaveSetIn, db: Session = Depends(get_db)):
    return check_build_compatibility(body.items or [], db)
