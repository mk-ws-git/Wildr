from pydantic import BaseModel, field_validator
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int
    review_text: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("rating must be between 1 and 5")
        return v


class ReviewUpdate(BaseModel):
    rating: int | None = None
    review_text: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v: int | None) -> int | None:
        if v is not None and not 1 <= v <= 5:
            raise ValueError("rating must be between 1 and 5")
        return v


class LocationReviewResponse(BaseModel):
    id: int
    user_id: int
    location_id: int
    rating: int
    review_text: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WalkReviewResponse(BaseModel):
    id: int
    user_id: int
    walk_id: int
    rating: int
    review_text: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
