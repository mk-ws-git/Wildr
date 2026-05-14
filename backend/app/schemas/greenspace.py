from pydantic import BaseModel
from datetime import datetime


class GreenspacePin(BaseModel):
    id: int
    name: str | None
    type: str | None
    lat: float
    lng: float
    area_sqm: float | None
    geojson: str | None = None

    model_config = {"from_attributes": True}


class GreenspaceSummary(BaseModel):
    id: int
    name: str | None
    type: str | None
    area_sqm: float | None
    summary: str | None
    summary_source: str | None  # "wikipedia" or "claude"
    recent_sightings: list[dict]
    species_count: int
