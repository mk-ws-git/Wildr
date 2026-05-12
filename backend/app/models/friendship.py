from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.models.base import Base

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    addressee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum("pending", "accepted", "blocked", name="friendship_status"), nullable=False, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())