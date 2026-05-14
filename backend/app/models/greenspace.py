from sqlalchemy import Column, Integer, BigInteger, Text, String, Float, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.models.base import Base

class Greenspace(Base):
    __tablename__ = "greenspaces"

    id = Column(Integer, primary_key=True)
    osm_id = Column(BigInteger, unique=True)
    name = Column(Text)
    type = Column(String(50))
    geometry = Column(Geography())
    centre_point = Column(Geography(geometry_type="POINT", srid=4326))
    area_sqm = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())