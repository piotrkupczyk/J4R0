from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from sqlalchemy import func
from sqlalchemy.orm import aliased

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/", response_model=list[schemas.Product])
def get_products(db: Session = Depends(get_db)):
    produkty = db.query(models.Product).all()
    return produkty




@router.get("/gpu-joined")
def gpu_joined(db: Session = Depends(get_db)):
    # product p  ⟂  gpu g  (p.id_prod == g.id_gpu)
    rows = (
        db.query(models.Product, models.GPU)
        .join(models.GPU, models.GPU.id_gpu == models.Product.id_prod)  # INNER JOIN – wystarczy ten
        # .outerjoin(...) gdybyś chciał też produkty bez wpisu w gpu
        .all()
    )
    return [{
        "id": p.id_prod,
        "type": "GPU",
        "name": p.nazwa,
        "price": float(p.cena),
        "tdp": g.tdp,
        "length": g.dlugosc,
        "chipset": g.chipset,
        "vram": g.vram,
        "gddr": g.gddr,
        "hdmi": g.ilosc_hdmi,
        "dp": g.ilosc_dp,
        "dual_bios": g.dual_bios,
    } for (p, g) in rows]
