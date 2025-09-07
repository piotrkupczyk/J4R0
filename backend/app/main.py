from fastapi import FastAPI
from app.routers import products,gpus,cart
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()


origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]




app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # konkretne originy, nie "*"
    allow_credentials=True,    # OK, ale wtedy nie można użyć "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
app.include_router(products.router)
app.include_router(gpus.router)
app.include_router(cart.router)

@app.get("/")
def root():
    return {"message": "API działa poprawnie!"}




