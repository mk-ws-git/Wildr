from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from app.models.base import Base

class UserLocation(Base):
    __tablename__ = "user_locations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    visit_count = Column(Integer, default=0)
    species_count = Column(Integer, default=0)
    first_visited = Column(DateTime(timezone=True))
    last_visited = Column(DateTime(timezone=True))

    __table_args__ = (UniqueConstraint("user_id", "location_id"),)