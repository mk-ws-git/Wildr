from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from geoalchemy2.shape import to_shape
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
    place_name = Column(Text)
    notes = Column(Text)
    weather_temp_c = Column(Numeric(5, 2))
    weather_description = Column(String(100))
    weather_data = Column(JSONB)
    is_private = Column(Boolean, default=False)
    identified_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def lat(self) -> float | None:
        if self.location is None:
            return None
        return float(to_shape(self.location).y)

    @property
    def lng(self) -> float | None:
        if self.location is None:
            return None
        return float(to_shape(self.location).x)