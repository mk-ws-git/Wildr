from pydantic import BaseModel


class SpeciesResponse(BaseModel):
    id: int
    common_name: str
    scientific_name: str
    kingdom: str
    rarity_tier: str | None
    conservation_status: str | None
    fun_fact: str | None
    habitat: str | None
    behaviour: str | None
    seasonal_note: str | None
    photos: list[str] = []
    audio_urls: list[str] = []

    model_config = {"from_attributes": True}


class SpeciesListItem(SpeciesResponse):
    saved: bool = False
    seen: bool = False
