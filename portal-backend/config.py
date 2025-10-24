from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # --- Database Setting ---
    database_url: str = Field(alias='DATABASE_URL')

    # --- Azure Auth Settings ---
    tenant_id: str = Field(alias='AZURE_TENANT_ID')
    client_id: str = Field(alias='AZURE_CLIENT_ID')

    model_config = SettingsConfigDict(env_file=".env", extra='ignore')


settings = Settings()