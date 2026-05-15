from pydantic import BaseModel
from datetime import datetime


class WalkCreate(BaseModel):
    name: str
    description: str | None = None
    difficulty: str | None = None
    estimated_duration_minutes: int | None = None


class WalkResponse(BaseModel):
    id: int
    created_by: int
    name: str
    description: str | None
    difficulty: str | None
    estimated_duration_minutes: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WalkStopCreate(BaseModel):
    location_id: int
    stop_order: int
    description: str | None = None


class WalkStopResponse(BaseModel):
    id: int
    walk_id: int
    location_id: int
    stop_order: int
    description: str | None
    audio_url: str | None

    model_config = {"from_attributes": True}


class WalkCompletionResponse(BaseModel):
    id: int
    user_id: int
    walk_id: int
    completed_at: datetime

    model_config = {"from_attributes": True}


class WalkSightingResponse(BaseModel):
    id: int
    walk_id: int
    sighting_id: int

    model_config = {"from_attributes": True}