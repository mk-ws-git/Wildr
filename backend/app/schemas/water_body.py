from pydantic import BaseModel


class WaterBodyPin(BaseModel):
    id: int
    name: str | None
    type: str | None
    water_subtype: str | None
    is_swimming_spot: bool
    lat: float
    lng: float
    area_sqm: float | None

    model_config = {"from_attributes": True}


class WaterBodySummary(BaseModel):
    id: int
    name: str | None
    type: str | None
    water_subtype: str | None
    is_swimming_spot: bool
    area_sqm: float | None
    summary: str | None
    summary_source: str | None  # "wikipedia" or "claude"
    recent_sightings: list[dict]
    species_count: int
