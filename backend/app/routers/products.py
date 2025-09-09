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
    rows = (
        db.query(models.Product, models.GPU)
        .join(models.GPU, models.GPU.id_gpu == models.Product.id_prod)  
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


@router.get("/cpu-joined")
def cpu_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.CPU)
        .join(models.CPU, models.CPU.id_cpu == models.Product.id_prod)
        .all()
    )
    return [{
        "id": p.id_prod,
        "type": "CPU",
        "name": p.nazwa,
        "price": float(p.cena),
        "socket": c.socket,
        "tdp": c.tdp,
        "cores": c.rdzenie,
        "threads": c.watki,
        "clock": c.zegar,
        "cooler": c.ma_cooler,
        "oc": c.podkrecanie,
        "integra": c.ma_integre,
    } for (p, c) in rows]

@router.get("/mobo-joined")
def mobo_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.Mobo)
        .join(models.Mobo, models.Mobo.id_mobo == models.Product.id_prod)
        .all()
    )
    def b2(v):  
        if v is None: return None
        return bool(v)

    return [{
        "id": p.id_prod,
        "type": "Motherboard",
        "name": p.nazwa,
        "price": float(p.cena),

        
        "socket": m.socket,
        "ramType": m.ddr,

        
        "formFactor": m.format,
        "maxRam": m.max_ram,
        "ramSlots": m.ilosc_slotow_ram,
        "m2": m.ilosc_slotow_m2,
        "pcie16": m.ilosc_pcie_x16,
        "pcie1": m.ilosc_pcie_x1,
        "usb3": m.ilosc_usb_3_0,
        "usb2": m.ilosc_usb_2_0,
        "usbC": m.ilosc_usb_c,
        "wifi": b2(m.wifi),
        "bluetooth": b2(m.bluetooth),
        "bios": m.bios_typ,
        "oc": b2(m.podkrecanie),
    } for (p, m) in rows]





@router.get("/ram-joined")
def ram_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.Ram)
        .join(models.Ram, models.Ram.id_ram == models.Product.id_prod)
        .all()
    )
    return [{
        "id": p.id_prod,
        "type": "RAM",
        "name": p.nazwa,
        "price": float(p.cena),

        
        "size": r.pojemnosc_total,      
        "ramType": r.ddr,

        
        "modules": r.liczba_modulow,
        "perModule": r.pojemnosc_modulu,
        "mhz": r.taktowanie,
        "cl": r.clock_latency,
        "profile": r.profil
    } for (p, r) in rows]



@router.get("/psu-joined")
def psu_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.Psu)
        .join(models.Psu, models.Psu.id_psu == models.Product.id_prod)
        .all()
    )

    def mod_desc(v: int | None):
        if v is None: return None
        return {0: "niemodularny", 1: "pół-modularny", 2: "w pełni modularny"}.get(v, str(v))

    return [{
        "id": p.id_prod,
        "type": "PSU",
        "name": p.nazwa,
        "price": float(p.cena),

        # pola pod frontend
        "watt": s.moc,
        "formFactor": s.format,
        "modular": mod_desc(s.modularnosc),
        "cert": s.certyfikat
    } for (p, s) in rows]


@router.get("/case-joined")
def case_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.PCCase)
        .join(models.PCCase, models.PCCase.id_case == models.Product.id_prod)
        .all()
    )
    return [{
        "id": p.id_prod,
        "type": "Case",
        "name": p.nazwa,
        "price": float(p.cena),

        
        "gpuMax": c.dlugosc,

        
        "formFactor": c.format,
        "fans": c.ilosc_wentylatorow,
        "height": c.wysokosc,
        "width": c.szerokosc,
        "lengthOuter": c.dlugosc,  
    } for (p, c) in rows]


@router.get("/storage-joined")
def storage_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.Dysk)
        .join(models.Dysk, models.Dysk.id_dysk == models.Product.id_prod)
        .all()
    )
    return [{
        "id": p.id_prod,
        "type": "Storage",
        "name": p.nazwa,
        "price": float(p.cena),

        
        "iface": d.interfejs,

        
        "medium": d.typ,                      
        "formFactor": d.format,               
        "sizeGB": d.pojemnosc_gb,
        "readMBs": d.predkosc_odczytu,
        "writeMBs": d.predkosc_zapisu,
    } for (p, d) in rows]



###########################################################################

@router.get("/cooler-joined")
def cooler_joined(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Product, models.Cooler)
        .join(models.Cooler, models.Cooler.id_cooler == models.Product.id_prod)
        .filter(models.Product.typ.ilike("cooler"))      
        .all()
    )
    return [
        {
            "id": p.id_prod,
            "type": "Cooler",
            "name": p.nazwa,
            "price": float(p.cena),
            "height": c.wysokosc,
            "fans": c.ilosc_wentylatorow,
            "cooler_type": c.typ,         
            "rgb": c.rgb,                 
            "profile": c.profil,           
            "sockets": [s.kod for s in c.sockets],   
        }
        for (p, c) in rows
    ]