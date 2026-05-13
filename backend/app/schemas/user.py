from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: str | None
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    bio: str | None = None
    avatar_url: str | None = None  

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"