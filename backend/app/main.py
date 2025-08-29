from fastapi import FastAPI
from app.routers import products,gpus
from app.database import engine
from app import models
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # w dev może być
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
app.include_router(products.router)
app.include_router(gpus.router)

@app.get("/")
def root():
    return {"message": "API działa poprawnie!"}
