from pydantic import BaseModel
from datetime import datetime
from typing import Any


class SightingCreate(BaseModel):
    species_id: int
    location_id: int | None = None
    lat: float | None = None
    lng: float | None = None
    place_name: str | None = None
    notes: str | None = None
    sighted_at: datetime | None = None
    quantity: int | None = None
    behaviour: str | None = None
    life_stage: str | None = None
    sex: str | None = None
    is_private: bool = False


class SightingUpdate(BaseModel):
    place_name: str | None = None
    notes: str | None = None
    location_id: int | None = None
    sighted_at: datetime | None = None
    quantity: int | None = None
    behaviour: str | None = None
    life_stage: str | None = None
    sex: str | None = None
    is_private: bool | None = None


class SightingResponse(BaseModel):
    id: int
    user_id: int
    species_id: int
    location_id: int | None
    lat: float | None = None
    lng: float | None = None
    place_name: str | None = None
    photo_url: str | None
    audio_url: str | None
    waveform_data: list[Any] | None
    is_private: bool
    notes: str | None
    sighted_at: datetime | None = None
    quantity: int | None = None
    behaviour: str | None = None
    life_stage: str | None = None
    sex: str | None = None
    # Weather
    weather_temp_c: float | None = None
    weather_feels_like_c: float | None = None
    weather_wind_speed_ms: float | None = None
    weather_wind_deg: int | None = None
    weather_humidity: int | None = None
    weather_description: str | None = None
    weather_code: str | None = None
    weather_data: dict | None = None
    identified_at: datetime

    model_config = {"from_attributes": True}


class SightingWithSpecies(SightingResponse):
    common_name: str
    scientific_name: str
    kingdom: str | None
    rarity_tier: str | None
