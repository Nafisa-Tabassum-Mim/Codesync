from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    COOKIE_SECURE: bool = False

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()