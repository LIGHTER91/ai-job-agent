from __future__ import annotations

from .base import JobPosting


class FranceTravailSource:
    """Placeholder adapter for a future authenticated France Travail integration.

    The MVP keeps this disabled by default because OAuth client credentials are required.
    """

    name = "France Travail"

    def __init__(self, client_id: str | None, client_secret: str | None) -> None:
        self.client_id = client_id
        self.client_secret = client_secret

    def fetch(self, query: str, limit: int = 20) -> list[JobPosting]:
        if not self.client_id or not self.client_secret:
            return []
        # This MVP keeps France Travail as an opt-in placeholder until OAuth is wired.
        return []
