from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base

class WalkStop(Base):
    __tablename__ = "walk_stops"

    id = Column(Integer, primary_key=True)
    walk_id = Column(Integer, ForeignKey("walks.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    stop_order = Column(Integer, nullable=False)
    description = Column(Text)
    audio_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())