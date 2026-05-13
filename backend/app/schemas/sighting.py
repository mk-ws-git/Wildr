from pydantic import BaseModel
from datetime import datetime


class SightingCreate(BaseModel):
    species_id: int
    location_id: int | None = None
    lat: float | None = None
    lng: float | None = None
    notes: str | None = None


class SightingResponse(BaseModel):
    id: int
    user_id: int
    species_id: int
    location_id: int | None
    photo_url: str | None
    audio_url: str | None
    notes: str | None
    identified_at: datetime

    model_config = {"from_attributes": True}