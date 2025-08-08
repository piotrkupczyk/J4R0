from fastapi import FastAPI
from app.routers import products
from app.database import engine
from app import models

app = FastAPI()

models.Base.metadata.create_all(bind=engine)
app.include_router(products.router)

@app.get("/")
def root():
    return {"message": "API działa poprawnie!"}
