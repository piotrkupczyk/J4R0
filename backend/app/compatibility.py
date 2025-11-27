# app/compatibility.py
from typing import List, Dict
from sqlalchemy.orm import Session
from app import schemas, models

def check_build_compatibility(items: List[schemas.BuildItem], db: Session) -> schemas.CompatResult:
    """
    Minimalne sprawdzanie kompatybilności:
    - CPU ↔ MOBO: zgodność socketu.
    W razie potrzeby łatwo rozszerzysz o RAM/CASE/PSU itd.
    """
    issues: list[schemas.CompatIssue] = []
    warnings: list[schemas.CompatIssue] = []

    # Zmapuj typ -> id
    by_type: Dict[str, int] = {it.typ: it.id for it in (items or [])}

    cpu_id = by_type.get("CPU")
    mobo_id = by_type.get("MOBO")

    if cpu_id and mobo_id:
        cpu = db.query(models.CPU).filter(models.CPU.id_cpu == cpu_id).first()
        mobo = db.query(models.Mobo).filter(models.Mobo.id_mobo == mobo_id).first()

        cpu_socket = getattr(cpu, "socket", None) if cpu else None
        mobo_socket = getattr(mobo, "socket", None) if mobo else None

        if cpu and mobo and cpu_socket and mobo_socket:
            if cpu_socket != mobo_socket:
                issues.append(schemas.CompatIssue(
                    level="error",
                    message=f"Niezgodny socket CPU ({cpu_socket}) i MOBO ({mobo_socket})."
                ))
        else:
            warnings.append(schemas.CompatIssue(
                level="warn",
                message="Nie udało się odczytać socketu CPU lub MOBO – sprawdź bazę / modele."
            ))

    ok = not issues
    return schemas.CompatResult(ok=ok, issues=issues, warnings=warnings)
