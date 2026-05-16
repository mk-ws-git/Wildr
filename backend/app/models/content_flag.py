from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base


class ContentFlag(Base):
    __tablename__ = "content_flags"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(String(30), nullable=False)   # 'location', 'greenspace', 'species'
    content_id = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="'open'")  # open / resolved / dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
