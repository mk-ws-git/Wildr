from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
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
    location_name = Column(Text)
    location_lat = Column(Float)
    location_lng = Column(Float)
    share_sightings_community = Column(Boolean, default=True, nullable=False, server_default="true")
    anonymize_community_sightings = Column(Boolean, default=False, nullable=False, server_default="false")
    share_sightings_inat = Column(Boolean, default=False, nullable=False, server_default="false")
    role = Column(String(20), nullable=False, server_default="'user'")  # user / trusted / admin — backend only
    created_at = Column(DateTime(timezone=True), server_default=func.now())