from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Wildr API"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://localhost/wildr"
    SECRET_KEY: str = "change_me_in_production"

    ANTHROPIC_API_KEY: str = ""
    MAPBOX_TOKEN: str = ""
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "wildr-media"
    R2_PUBLIC_URL: str = ""

    class Config:
        env_file = "../.env"


settings = Settings()
