"""
Central application settings.

All configuration is environment-driven so the same codebase runs against
SQLite in local development and PostgreSQL (Supabase) in production without
any code changes — only environment variables differ.
"""
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    app_name: str = "EHS Next API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"  # "development" | "production"

    # --- Database ---
    # Dev default: local SQLite file. Prod: set DATABASE_URL to the Supabase
    # PostgreSQL connection string via environment variables (never committed).
    # Supabase (and most providers) hand out "postgres://" or "postgresql://"
    # URLs, which default to the psycopg2 driver. This project uses psycopg3
    # instead, so the scheme is normalized automatically below — paste the
    # connection string exactly as Supabase gives it, no manual editing needed.
    database_url: str = "sqlite:///./ehs_connect.db"

    @field_validator("database_url")
    @classmethod
    def normalize_postgres_scheme(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v[len("postgresql://") :]
        return v

    # --- Auth / JWT ---
    jwt_secret_key: str = "CHANGE_ME_IN_ENV__NEVER_COMMIT_REAL_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # --- CORS ---
    # A comma-separated string, not a list — pydantic-settings tries to JSON-parse
    # list-typed env vars before any validator runs, which breaks a plain
    # comma-separated value pasted into Railway's env var UI. Use
    # `cors_allow_origins_list` below to get the parsed list.
    cors_allow_origins: str = "http://localhost:5173,http://localhost:19006"

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]

    # --- One-time remote migration trigger ---
    # See app/api/v1/ops.py. Deliberately has NO default — if this isn't
    # explicitly set in the environment, the /ops/migrate endpoint refuses
    # to run anything, so there's no accidental unprotected door into
    # running migrations against the production database.
    migration_secret: str | None = None

    # Firebase service account JSON (as a single-line string), used to send
    # FCM push notifications for the PWA. Optional — if unset, FCM sending
    # silently no-ops (same pattern as Expo push failures: never break the
    # underlying action that triggered a notification).
    firebase_service_account_json: str | None = None

    # --- Society location (used to compute daily sunset for Maghrib) ---
    # AWC Housing Society, near Wah Cantt / Taxila, Punjab, Pakistan.
    # Longitude is positive EAST. Pakistan is UTC+5 year-round (no DST),
    # so a fixed offset is correct and avoids a tzdata dependency.
    # Overridable via env vars if the society location is ever refined.
    society_latitude: float = 33.85424
    society_longitude: float = 72.72615
    society_utc_offset_hours: float = 5.0

    # --- Zoho Mail (email notifications) ---
    # All optional — if zoho_smtp_user/zoho_smtp_password are unset, email
    # sending silently no-ops (same defensive pattern as FCM/Expo push
    # above: a missing credential must never break the action that
    # triggered a notification).
    zoho_smtp_host: str = "smtp.zoho.com"
    zoho_smtp_port: int = 465
    zoho_smtp_user: str | None = None
    zoho_smtp_password: str | None = None
    zoho_sender_email: str | None = None  # defaults to zoho_smtp_user if unset
    zoho_sender_name: str = "EHS Next"

    # --- Society leadership notification routing ---
    # Deliberately separate from SocietyInfo (the public "About" content) —
    # these are operational email addresses used for routing notifications,
    # not bio/content data shown to residents.
    chairman_email: str | None = None
    deputy_chairman_email: str | None = None
    secretary_email: str | None = None
    support_email: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Settings are cached so the .env file is parsed only once per process."""
    return Settings()
