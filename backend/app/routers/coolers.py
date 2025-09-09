# routers/coolers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/coolers", tags=["Coolers"])

@router.get("/{cooler_id}", response_model=schemas.CoolerOut)
def get_cooler(cooler_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Cooler, cooler_id)
    if not c: raise HTTPException(404, "Cooler not found")
    return c

@router.post("/{cooler_id}/sockets/{code}", status_code=204)
def attach_socket(cooler_id: int, code: str, db: Session = Depends(get_db)):
    c = db.get(models.Cooler, cooler_id)
    if not c: raise HTTPException(404, "Cooler not found")
    s = db.query(models.Socket).filter(models.Socket.code == code).first()
    if not s: raise HTTPException(404, "Socket not found")
    if s not in c.sockets:
        c.sockets.append(s)
        db.commit()
    return

@router.delete("/{cooler_id}/sockets/{code}", status_code=204)
def detach_socket(cooler_id: int, code: str, db: Session = Depends(get_db)):
    c = db.get(models.Cooler, cooler_id)
    if not c: raise HTTPException(404, "Cooler not found")
    s = db.query(models.Socket).filter(models.Socket.code == code).first()
    if not s: return
    if s in c.sockets:
        c.sockets.remove(s)
        db.commit()
    return