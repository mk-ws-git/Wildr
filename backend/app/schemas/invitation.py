from datetime import datetime
from pydantic import BaseModel, EmailStr


class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    id: int
    email: str
    status: str
    created_at: datetime
    accepted_at: datetime | None = None

    model_config = {"from_attributes": True}
