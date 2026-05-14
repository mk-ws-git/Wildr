from pydantic import BaseModel
from datetime import datetime

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str | None
    icon_url: str | None
    criteria: str | None

    model_config = {"from_attributes": True}

class UserBadgeResponse(BaseModel):
    badge: BadgeResponse
    earned_at: datetime

    model_config = {"from_attributes": True}