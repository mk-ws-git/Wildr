from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Wildr API"
    debug: bool = False

    database_url: str = "postgresql://localhost/wildr"
    secret_key: str = "change_me_in_production"

    anthropic_api_key: str = ""
    mapbox_token: str = ""

    class Config:
        env_file = "../../.env"


settings = Settings()
