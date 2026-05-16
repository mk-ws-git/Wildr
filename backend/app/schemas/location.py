from pydantic import BaseModel
from datetime import datetime


class LocationCreate(BaseModel):
    name: str
    type: str | None = None
    lat: float
    lng: float
    radius_metres: int | None = None
    facilities: list[str] = []


class LocationUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    radius_metres: int | None = None
    facilities: list[str] | None = None


class LocationResponse(BaseModel):
    id: int
    name: str
    type: str | None
    radius_metres: int | None
    facilities: list[str] = []
    lat: float | None = None
    lng: float | None = None
    source: str
    created_by: int | None
    created_at: datetime
    visited: bool = False

    model_config = {"from_attributes": True}