import os
from dataclasses import dataclass
from pathlib import Path


def _bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class Settings:
    output_path: Path = Path(os.getenv("JOB_AGENT_OUTPUT", "web/public/data/jobs.json"))
    max_results: int = int(os.getenv("JOB_AGENT_MAX_RESULTS", "30"))
    enable_remotive: bool = _bool("ENABLE_REMOTIVE", True)
    enable_jobicy: bool = _bool("ENABLE_JOBICY", True)
    enable_adzuna: bool = _bool("ENABLE_ADZUNA", False)
    enable_france_travail: bool = _bool("ENABLE_FRANCE_TRAVAIL", False)
    adzuna_app_id: str | None = os.getenv("ADZUNA_APP_ID")
    adzuna_app_key: str | None = os.getenv("ADZUNA_APP_KEY")
    adzuna_country: str = os.getenv("ADZUNA_COUNTRY", "fr")
    france_travail_client_id: str | None = os.getenv("FRANCE_TRAVAIL_CLIENT_ID")
    france_travail_client_secret: str | None = os.getenv("FRANCE_TRAVAIL_CLIENT_SECRET")


SETTINGS = Settings()
