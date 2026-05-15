from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.base import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True)
    inviter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(Text, nullable=False)
    token = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending | accepted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    invitee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
