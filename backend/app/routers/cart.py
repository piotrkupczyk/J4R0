from fastapi import APIRouter, Depends, HTTPException , Response
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.database import get_db
from app import models, schemas
from datetime import date

router = APIRouter(prefix="/carts", tags=["Cart"])

# ===== helpers =====
def _cart_view(cart_id: int, db: Session) -> schemas.CartOut:
    cart = db.get(models.Koszyk, cart_id)
    if not cart:
        raise HTTPException(404, "Koszyk nie istnieje")

    items: list[schemas.CartItemOut] = []
    total = 0.0
    for pos in cart.pozycje:           
        p = pos.produkt                
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

#tworzenie koszyka
@router.post("/", response_model=schemas.Cart, status_code=201)
def create_cart(body: schemas.CartCreate | None = None, db: Session = Depends(get_db)):
    payload = (body.model_dump() if body else {}) | {
        "data_utworzenia": date.today(),
        "data_aktualizacji": date.today(),
    }
    cart = models.Koszyk(**payload)
    db.add(cart); db.commit(); db.refresh(cart)
    return cart

@router.get("/{cart_id}", response_model=schemas.CartOut)
def get_cart(cart_id: int, db: Session = Depends(get_db)):
    cart = db.get(models.Koszyk, cart_id)
    if not cart:
        raise HTTPException(404, "Koszyk nie istnieje")

    rows = (db.query(models.KoszykPozycja, models.Product)
              .join(models.Product, models.Product.id_prod == models.KoszykPozycja.produkty_id_prod)
              .filter(models.KoszykPozycja.koszyk_id_koszyka == cart_id)
              .all())

    items = []
    total = 0.0
    for pos, prod in rows:
        suma = float(prod.cena) * (pos.ilosc or 0)
        items.append({
          "product_id": prod.id_prod,
          "nazwa": prod.nazwa,
          "typ": prod.typ,
          "cena": float(prod.cena),
          "ilosc": pos.ilosc,
          "suma": suma
        })
        total += suma

    return {"id_koszyka": cart.id_koszyka, "nazwa": cart.nazwa, "items": items, "total": total}



@router.get("/{cart_id}/items", response_model=list[schemas.CartItemOut])
def list_items(cart_id: int, db: Session = Depends(get_db)):
    out = get_cart(cart_id, db)
    return out.items


@router.post("/{cart_id}/items", response_model=schemas.CartItem, status_code=201)
def add_or_inc_item(cart_id: int, body: schemas.CartItemCreate, db: Session = Depends(get_db)):
    if not db.get(models.Koszyk, cart_id):
        raise HTTPException(404, "Koszyk nie istnieje")
    if not db.get(models.Product, body.produkty_id_prod):
        raise HTTPException(404, "Produkt nie istnieje")

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
    db.execute(stmt); db.commit()
    item = (db.query(models.KoszykPozycja)
              .filter_by(koszyk_id_koszyka=cart_id, produkty_id_prod=body.produkty_id_prod)
              .first())
    return item  


@router.delete("/{cart_id}/items/{product_id}", status_code=204)
def delete_item(cart_id: int, product_id: int, db: Session = Depends(get_db)):
    row = (db.query(models.KoszykPozycja)
             .filter_by(koszyk_id_koszyka=cart_id, produkty_id_prod=product_id)
             .first())
    if not row:
        raise HTTPException(404, "Pozycja nie istnieje")
    db.delete(row); db.commit()
    return Response(status_code=204)

#wyczyść koszyk 
@router.delete("/{cart_id}/items", status_code=204)
def clear_items(cart_id: int, db: Session = Depends(get_db)):
    (db.query(models.KoszykPozycja)
       .filter(models.KoszykPozycja.koszyk_id_koszyka == cart_id)
       .delete(synchronize_session=False))
    db.commit()
    return Response(status_code=204)



@router.post("/{cart_id}/items", response_model=schemas.CartItem, status_code=201)
def add_or_increment_item(cart_id: int, body: schemas.CartItemCreate, db: Session = Depends(get_db)):
    # walidacje
    if not db.get(models.Koszyk, cart_id):
        raise HTTPException(404, "Cart not found")
    if not db.get(models.Product, body.produkty_id_prod):
        raise HTTPException(404, "Product not found")

    # UPSERT
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

@router.delete("/{cart_id}/items", status_code=204)
def clear_cart_items(cart_id: int, db: Session = Depends(get_db)):
    deleted = (
        db.query(models.KoszykPozycja)
          .filter(models.KoszykPozycja.koszyk_id_koszyka == cart_id)
          .delete(synchronize_session=False)
    )
    db.commit()
    print(f"[Cart] cleared items for cart {cart_id} -> {deleted} rows")
    return Response(status_code=204)


@router.delete("/{cart_id}/items/{product_id}", status_code=204)
def delete_item(cart_id: int, product_id: int, db: Session = Depends(get_db)):
    pos = db.query(models.KoszykPozycja).filter_by(
        koszyk_id_koszyka=cart_id,
        produkty_id_prod=product_id
    ).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Pozycja nie istnieje")
    db.delete(pos); db.commit()
    return