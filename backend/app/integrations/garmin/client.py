
"""
Manages the connection and authentication with Garmin Personal API.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://personal.connectapi.garmin.com"


class GarminClient:

    def __init__(self):
        self.api_key = os.getenv("GARMIN_PERSONAL_API_KEY")
        self.token = None
        self.session = requests.Session()

    def get_token(self):
        """Obtain an access token from Garmin."""

        if not self.api_key:
            raise ValueError("GARMIN_PERSONAL_API_KEY is missing")

        headers = {
            "Authorization": f"ApiKey {self.api_key}",
            "Content-Type": "application/json"
        }

        response = self.session.post(
            f"{API_URL}/personalapitoken-service/personal-api/personal-api-key/token",
            headers=headers,
            timeout=30
        )

        response.raise_for_status()

        raw = response.text.strip()

        try:
            data = response.json()
            token = (
                data.get("access_token")
                or data.get("accessToken")
                or data.get("token")
                or raw
            )
        except ValueError:
            token = raw

        self.token = token
        return self.token

    def connect(self):
        """Ensure an access token is available."""
        if not self.token:
            self.get_token()

        return self

    def call(self, path, query=None, headers=None):
        if not self.token:
            self.connect()

        request_headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
        }

        if headers:
            request_headers.update(headers)

        response = self.session.get(
            API_URL + path,
            headers=request_headers,
            params=query or {},
            timeout=30
        )

        response.raise_for_status()
        return response.json()