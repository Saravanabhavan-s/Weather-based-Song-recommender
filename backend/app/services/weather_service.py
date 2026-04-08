from typing import Dict

import httpx
from fastapi import HTTPException, status

from app.config.settings import settings
from app.utils.mood_map import normalize_weather_condition

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


async def _fetch_weather(params: Dict[str, str]) -> Dict:
    if not settings.openweather_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenWeather API key is not configured.",
        )

    query = {**params, "appid": settings.openweather_api_key, "units": "metric"}

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(BASE_URL, params=query)

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Location not found.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Weather service is unavailable.")

    payload = response.json()
    weather = payload.get("weather", [{}])[0]
    main = payload.get("main", {})
    wind = payload.get("wind", {})

    raw_condition = weather.get("main") or weather.get("description") or "clear"

    return {
        "city": payload.get("name"),
        "country": payload.get("sys", {}).get("country"),
        "condition": normalize_weather_condition(raw_condition),
        "description": weather.get("description", "").title(),
        "temperature": float(main.get("temp", 0)),
        "humidity": int(main.get("humidity", 0)),
        "windSpeed": float(wind.get("speed", 0)),
    }


async def fetch_weather_by_city(city: str) -> Dict:
    return await _fetch_weather({"q": city})


async def fetch_weather_by_coords(lat: float, lon: float) -> Dict:
    return await _fetch_weather({"lat": str(lat), "lon": str(lon)})
