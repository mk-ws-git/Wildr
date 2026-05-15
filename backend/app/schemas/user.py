from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: str | None
    bio: str | None
    location_name: str | None
    location_lat: float | None
    location_lng: float | None
    created_at: datetime

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    bio: str | None = None
    avatar_url: str | None = None
    location_name: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"