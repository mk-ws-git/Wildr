from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.models.base import Base

class Walk(Base):
    __tablename__ = "walks"

    id = Column(Integer, primary_key=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(Enum("easy", "moderate", "hard", name="difficulty_enum"))
    estimated_duration_minutes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())