from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/", response_model=list[schemas.Product])
def get_products(db: Session = Depends(get_db)):
    produkty = db.query(models.Product).all()
    return produkty
