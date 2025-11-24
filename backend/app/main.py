from fastapi import FastAPI, Depends
from app.routers import products,gpus,cart,coolers,sockets,auth,builder
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth as auth_router
from app.routers import orders as orders_router
from app.deps import get_current_user




app = FastAPI()


origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
app.include_router(products.router)
app.include_router(gpus.router)
app.include_router(cart.router)
app.include_router(coolers.router)
app.include_router(sockets.router)

app.include_router(auth.router)
app.include_router(auth_router.router)
app.include_router(orders_router.router)
app.include_router(builder.router)

@app.get("/")
def root():
    return {"message": "API działa poprawnie!"}

@app.get("/me")
def me_alias(current = Depends(get_current_user)):
    return current



