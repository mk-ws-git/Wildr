from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.models.base import Base

class UserSpecies(Base):
    __tablename__ = "user_species"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    added_to_list = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint("user_id", "species_id"),)