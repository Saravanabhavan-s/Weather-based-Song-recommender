from typing import Dict, List

WEATHER_MOOD_MAP: Dict[str, List[str]] = {
    "rain": ["romantic", "calm", "melancholic"],
    "clear": ["happy", "energetic"],
    "cloud": ["chill", "soft"],
    "thunder": ["intense", "emotional"],
    "mist": ["dreamy", "lo-fi"],
    "snow": ["peaceful", "cozy"],
}


def normalize_weather_condition(raw_condition: str) -> str:
    value = (raw_condition or "").lower()
    if "thunder" in value or "storm" in value:
        return "thunder"
    if "drizzle" in value or "rain" in value:
        return "rain"
    if "snow" in value or "sleet" in value:
        return "snow"
    if "mist" in value or "fog" in value or "haze" in value or "smoke" in value:
        return "mist"
    if "cloud" in value:
        return "cloud"
    if "clear" in value or "sun" in value:
        return "clear"
    return "clear"


def moods_for_weather(raw_condition: str) -> List[str]:
    normalized = normalize_weather_condition(raw_condition)
    return WEATHER_MOOD_MAP.get(normalized, ["happy"])
