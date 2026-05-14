from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class FriendshipRequest(BaseModel):
    addressee_id: int

class FriendshipAction(BaseModel):
    action: Literal["accept", "reject", "block"]

class FriendshipResponse(BaseModel):
    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}