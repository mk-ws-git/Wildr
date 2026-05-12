from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.models.base import Base

class SpeciesSave(Base):
    __tablename__ = "species_saves"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "species_id"),)