from fastapi import FastAPI
from app.routers import products, orders, carts, clients

app = FastAPI()

# Rejestracja routerów
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(carts.router)
app.include_router(clients.router)

@app.get("/")
def root():
    return {"message": "API działa!"}
