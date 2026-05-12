from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    avatar_url = Column(Text)
    bio = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())