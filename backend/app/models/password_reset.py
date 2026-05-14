from sqlalchemy import Boolean, Column, Integer, Text, DateTime, func
from app.models.base import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    email = Column(Text, nullable=False)
    token = Column(Text, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used = Column(Boolean, default=False)
