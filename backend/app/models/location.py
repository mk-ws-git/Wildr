from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.models.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100))
    centre_point = Column(Geography(geometry_type="POINT", srid=4326))
    radius_metres = Column(Integer)
    source = Column(String(20), nullable=False, server_default="auto")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())