from sqlalchemy import Column, Integer, String, Text
from app.models.base import Base

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon_url = Column(Text)
    criteria = Column(Text)