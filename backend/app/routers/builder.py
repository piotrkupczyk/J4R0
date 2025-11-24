# app/routers/builder.py
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.compatibility import check_build_compatibility  # dodamy za chwilę


router = APIRouter(
    prefix="/builder",
    tags=["builder"],
)


class AddItemRequest(BaseModel):
    component_type: str   # "CPU", "GPU", "MOBO", "RAM", "PSU", "CASE", "DYSK", "COOLER"
    product_id: int       # id_prod z tabeli "produkty"


class RemoveItemRequest(BaseModel):
    component_type: str


# very simple in-memory storage for dev
# { user_id: { "CPU": 5, "GPU": 12, ... } }
user_builds: Dict[int, Dict[str, int]] = {}


def get_current_user_id() -> int:
    # TODO: later read from JWT
    return 1


@router.get("/build")
def get_build():
    user_id = get_current_user_id()
    return user_builds.get(user_id, {})


@router.post("/add")
def add_item(payload: AddItemRequest):
    user_id = get_current_user_id()
    build = user_builds.setdefault(user_id, {})
    build[payload.component_type] = payload.product_id

    return {
        "status": "ok",
        "build": build,
    }


@router.post("/remove")
def remove_item(payload: RemoveItemRequest):
    user_id = get_current_user_id()
    build = user_builds.setdefault(user_id, {})
    build.pop(payload.component_type, None)

    return {
        "status": "ok",
        "build": build,
    }


@router.post("/clear")
def clear_build():
    user_id = get_current_user_id()
    user_builds[user_id] = {}
    return {
        "status": "ok",
        "build": {},
    }


@router.get("/check")
def check_build():
    user_id = get_current_user_id()
    build = user_builds.get(user_id)

    if not build:
        raise HTTPException(status_code=400, detail="Empty build")

    result = check_build_compatibility(build)
    return result
