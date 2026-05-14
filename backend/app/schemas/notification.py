from pydantic import BaseModel
from datetime import datetime
from typing import Any

class NotificationResponse(BaseModel):
    id: int
    type: str
    payload: dict[str, Any] | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}