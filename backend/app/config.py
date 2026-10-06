"""Application configuration.

Values are read from environment variables (or an optional .env file).
See .env.example for the full list of supported keys.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the GCU backend."""

    app_name: str = "GCU"
    app_version: str = "0.1.0"
    database_url: str = "sqlite:///./gcu.db"
    jwt_secret: str = "gcu-hackathon-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    cors_origins: str = "*"

    # OpenAI-compatible LLM integration. Empty api key => deterministic fallback.
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"
    llm_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS origins as a list (supports a comma separated env value)."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()
