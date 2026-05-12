from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.models.base import Base

class Sighting(Base):
    __tablename__ = "sightings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"))
    location = Column(Geography(geometry_type="POINT", srid=4326))
    photo_url = Column(Text)
    audio_url = Column(Text)
    waveform_data = Column(JSONB)
    notes = Column(Text)
    is_private = Column(Boolean, default=False)
    identified_at = Column(DateTime(timezone=True), server_default=func.now())