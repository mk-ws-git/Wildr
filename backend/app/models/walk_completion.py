from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.models.base import Base

class WalkCompletion(Base):
    __tablename__ = "walk_completions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    walk_id = Column(Integer, ForeignKey("walks.id"), nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "walk_id"),)