from sqlalchemy import Column, Integer, String, Text, Enum
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base

class Species(Base):
    __tablename__ = "species"

    id = Column(Integer, primary_key=True)
    common_name = Column(String(255), nullable=False)
    scientific_name = Column(String(255), unique=True, nullable=False)
    kingdom = Column(Enum(
        'plant', 'fungi', 'bird', 'insect', 'mammal',
        'reptile', 'amphibian', 'fish', 'other',
        name='kingdom_enum'
    ), nullable=False)
    rarity_tier = Column(Enum(
        'common', 'uncommon', 'rare', 'very_rare',
        name='rarity_enum'
    ))
    conservation_status = Column(Enum(
        'least_concern', 'near_threatened', 'vulnerable', 'endangered',
        'critically_endangered', 'extinct_in_wild', 'extinct',
        name='conservation_status_enum'
    ))
    fun_fact = Column(Text)
    habitat = Column(Text)
    behaviour = Column(Text)
    seasonal_note = Column(Text)
    photos = Column(JSONB, nullable=False, server_default="'[]'")
    audio_urls = Column(JSONB, nullable=False, server_default="'[]'")