"""
Manages the connection and authentication with Garmin
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv() # To load variables from .env file

API_URL = 'https://personal.connectapi.garmin.com'
API_KEY = os.getenv("GARMIN_PERSONAL_API_KEY")

# Obtain token
def get_token():
    headers = {
        'Authorization': "ApiKey " + API_KEY,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(
            f"{API_URL}/personalapitoken-service/personal-api/personal-api-key/token",
            headers=headers,
        )
    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return None

    if response.status_code != 200:
        print("Error:", response.status_code, response.text)
        return None

    raw = response.text.strip()
    try:
        j = response.json()
        return j.get("access_token") or j.get("accessToken") or j.get("token") or raw
    except ValueError:
        return raw

# Use token with Bearer for future calls
def call(path, query=None, token=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    response = requests.get(API_URL + path, headers=headers, params=query or {})
    try:
        data = response.json()
    except ValueError:
        data = None
    return {
        "status": response.status_code,
        "ct": response.headers.get("content-type", ""),
        "size": len(response.text),
        "data": data,
        "text": response.text,
    }

def main():
    token = get_token()
    if not token:
        print("No se pudo obtener el token.")
        return

    print("Token obtenido:", token[:20] + "...")

    # Ejemplo de llamada autenticada — ajusta el path al endpoint real
    # result = call("/some-endpoint", {"limit": 10}, token)
    # print(result["status"], result["data"])


if __name__ == "__main__":
    main()