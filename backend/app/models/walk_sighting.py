from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.models.base import Base

class WalkSighting(Base):
    __tablename__ = "walk_sightings"

    id = Column(Integer, primary_key=True)
    walk_id = Column(Integer, ForeignKey("walks.id"), nullable=False)
    sighting_id = Column(Integer, ForeignKey("sightings.id"), nullable=False)

    __table_args__ = (UniqueConstraint("walk_id", "sighting_id"),)