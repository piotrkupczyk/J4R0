# routers/sockets.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/sockets", tags=["Sockets"])

@router.get("/", response_model=list[schemas.SocketOut])
def list_sockets(db: Session = Depends(get_db)):
    return db.query(models.Socket).order_by(models.Socket.kod).all()

@router.post("/", response_model=schemas.SocketOut, status_code=201)
def create_socket(body: schemas.SocketCreate, db: Session = Depends(get_db)):
    if db.query(models.Socket).filter(models.Socket.kod == body.kod).first():
        raise HTTPException(409, "Socket kod already exists")
    obj = models.Socket(kod=body.kod, vendor=body.vendor)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj