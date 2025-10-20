from fastapi import APIRouter, Depends
from app import models
from app.deps import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/")
def list_orders(current: models.Klient = Depends(get_current_user)):
    # TODO: zwróć realne zamówienia użytkownika
    return []  # na razie pusto, frontend to akceptuje
