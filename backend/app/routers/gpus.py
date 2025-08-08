from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/gpus",
    tags=["gpus"]
)

@router.get("/", response_model=list[schemas.GPU])
def get_gpus(db: Session = Depends(get_db)):
    gpus = db.query(models.GPU).all()
    return gpus