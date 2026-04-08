from datetime import datetime


def current_time_tag(now: datetime = None) -> str:
    value = now or datetime.now()
    hour = value.hour

    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 22:
        return "evening"
    return "night"
