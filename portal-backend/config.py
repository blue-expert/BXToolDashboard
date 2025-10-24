from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Reads the DATABASE_URL from the .env-file
    database_url: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()