from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/carts", tags=["Cart"])

# ===== helpers =====
def _cart_view(cart_id: int, db: Session) -> schemas.CartOut:
    cart = db.get(models.Koszyk, cart_id)
    if not cart:
        raise HTTPException(404, "Koszyk nie istnieje")

    items: list[schemas.CartItemOut] = []
    total = 0.0
    for pos in cart.pozycje:           # wymaga relacji w models.Koszyk.pozycje
        p = pos.produkt                # i relacji w models.KoszykPozycja.produkt
        suma = float(p.cena) * pos.ilosc
        items.append(schemas.CartItemOut(
            product_id=p.id_prod,
            nazwa=p.nazwa,
            typ=p.typ,
            cena=float(p.cena),
            ilosc=pos.ilosc,
            suma=suma
        ))
        total += suma

    return schemas.CartOut(
        id_koszyka=cart.id_koszyka,
        nazwa=cart.nazwa,
        items=items,
        total=total
    )

# ===== endpoints =====
@router.post("/", response_model=schemas.Cart, status_code=201)
def create_cart(body: schemas.CartCreate | None = None, db: Session = Depends(get_db)):
    payload = body.model_dump() if body else {}
    cart = models.Koszyk(**payload)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart

@router.get("/{cart_id}", response_model=schemas.CartOut)
def get_cart(cart_id: int, db: Session = Depends(get_db)):
    return _cart_view(cart_id, db)

@router.post("/{cart_id}/items", response_model=schemas.CartItem, status_code=201)
def add_or_increment_item(cart_id: int, body: schemas.CartItemCreate, db: Session = Depends(get_db)):
    # walidacje
    if not db.get(models.Koszyk, cart_id):
        raise HTTPException(404, "Cart not found")
    if not db.get(models.Product, body.produkty_id_prod):
        raise HTTPException(404, "Product not found")

    # UPSERT: jeśli (cart_id, product_id) istnieje -> zwiększ ilość
    stmt = insert(models.KoszykPozycja).values(
        koszyk_id_koszyka=cart_id,
        produkty_id_prod=body.produkty_id_prod,
        ilosc=body.ilosc or 1,
    ).on_conflict_do_update(
        index_elements=[
            models.KoszykPozycja.koszyk_id_koszyka,
            models.KoszykPozycja.produkty_id_prod
        ],
        set_={"ilosc": models.KoszykPozycja.ilosc + (body.ilosc or 1)}
    )
    db.execute(stmt)
    db.commit()

    # zwrot aktualnego wiersza
    item = (db.query(models.KoszykPozycja)
              .filter_by(koszyk_id_koszyka=cart_id, produkty_id_prod=body.produkty_id_prod)
              .first())
    return item

@router.delete("/{cart_id}/items/{product_id}", response_model=schemas.CartOut, status_code=200)
def delete_item(cart_id: int, product_id: int, db: Session = Depends(get_db)):
    row = (db.query(models.KoszykPozycja)
             .filter_by(koszyk_id_koszyka=cart_id, produkty_id_prod=product_id)
             .first())
    if row:
        db.delete(row)
        db.commit()
    return _cart_view(cart_id, db)
