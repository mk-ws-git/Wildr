from sqlalchemy import Column, Integer, SmallInteger, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.models.base import Base

class LocationReview(Base):
    __tablename__ = "location_reviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    rating = Column(SmallInteger, nullable=False)
    review_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "location_id"),)