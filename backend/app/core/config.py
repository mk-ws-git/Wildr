from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Wildr API"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://localhost/wildr"
    SECRET_KEY: str = "change_me_in_production"

    ANTHROPIC_API_KEY: str = ""
    MAPBOX_TOKEN: str = ""

    class Config:
        env_file = "../.env"


settings = Settings()
