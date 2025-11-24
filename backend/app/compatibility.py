# app/compatibility.py
from typing import Dict

from sqlalchemy.orm import Session

from app.database import get_db
from app import models


def _get_cpu(db: Session, product_id: int):
    return (
        db.query(models.CPU)
        .filter(models.CPU.id_prod == product_id)
        .first()
    )


def _get_mobo(db: Session, product_id: int):
    return (
        db.query(models.MOBO)
        .filter(models.MOBO.id_prod == product_id)
        .first()
    )


def _get_gpu(db: Session, product_id: int):
    return (
        db.query(models.GPU)
        .filter(models.GPU.id_prod == product_id)
        .first()
    )


def _get_ram(db: Session, product_id: int):
    return (
        db.query(models.RAM)
        .filter(models.RAM.id_prod == product_id)
        .first()
    )


def _get_psu(db: Session, product_id: int):
    return (
        db.query(models.PSU)
        .filter(models.PSU.id_prod == product_id)
        .first()
    )


def _get_case(db: Session, product_id: int):
    return (
        db.query(models.CASE)
        .filter(models.CASE.id_prod == product_id)
        .first()
    )


def _get_cooler(db: Session, product_id: int):
    return (
        db.query(models.Cooler)
        .filter(models.Cooler.id_prod == product_id)
        .first()
    )


def check_build_compatibility(build: Dict[str, int]) -> dict:
    """
    build: { "CPU": 1, "GPU": 5, "MOBO": 3, ... }
    """
    db: Session = next(get_db())
    errors = []

    cpu = _get_cpu(db, build.get("CPU")) if build.get("CPU") else None
    mobo = _get_mobo(db, build.get("MOBO")) if build.get("MOBO") else None
    gpu = _get_gpu(db, build.get("GPU")) if build.get("GPU") else None
    ram = _get_ram(db, build.get("RAM")) if build.get("RAM") else None
    psu = _get_psu(db, build.get("PSU")) if build.get("PSU") else None
    case = _get_case(db, build.get("CASE")) if build.get("CASE") else None
    cooler = _get_cooler(db, build.get("COOLER")) if build.get("COOLER") else None

    # 1) CPU ↔ MOBO (socket)
    if cpu and mobo and cpu.socket != mobo.socket:
        errors.append("Procesor i płyta główna mają różne gniazda (socket).")

    # 2) RAM ↔ MOBO (standard DDR)
    if ram and mobo and ram.ddr_standard != mobo.ddr_standard:
        errors.append("Pamięć RAM nie pasuje do standardu DDR płyty głównej.")

    # 3) GPU ↔ Obudowa (długość)
    if gpu and case and gpu.dlugosc_mm > case.gpu_max_dlugosc_mm:
        errors.append("Karta graficzna jest zbyt długa do wybranej obudowy.")

    # 4) PSU ↔ TDP (CPU+GPU)
    if psu and cpu and gpu:
        required_power = cpu.tdp_w + gpu.tdp_w + 150  # prosty zapas
        if psu.moc_w < required_power:
            errors.append(
                "Zasilacz ma zbyt małą moc względem zapotrzebowania procesora i karty graficznej."
            )

    # 5) Cooler ↔ CPU (obsługiwane sockety)
    if cooler and cpu:
        # np. cooler.sockety to lista stringów
        supported = getattr(cooler, "sockety", []) or []
        if cpu.socket not in supported:
            errors.append("Chłodzenie CPU nie obsługuje socketu wybranego procesora.")

    return {
        "compatible": len(errors) == 0,
        "errors": errors,
    }
