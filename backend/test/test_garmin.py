
from app.integrations.garmin.client import GarminClient
from app.integrations.garmin.activities import ActivitiesAPI
from app.integrations.garmin.health import HealthAPI

from app.integrations.garmin.client import GarminClient
from app.integrations.garmin.activities import ActivitiesAPI
from app.integrations.garmin.health import HealthAPI


def summarize(label, data):
    if data is None:
        print(f"{label}: None")
        return
    if isinstance(data, list):
        print(f"{label}: list[{len(data)}] first={data[0] if data else None}")
    elif isinstance(data, dict):
        print(f"{label}: dict[{len(data)}] keys={list(data.keys())[:5]}")
    else:
        print(f"{label}: {type(data).__name__} {str(data)[:120]}")


def main():
    # Initialize client and authenticate
    client = GarminClient()
    client.connect()

    print("Garmin authentication successful...")

    # Initialize API classes
    activities = ActivitiesAPI(client)
    health = HealthAPI(client)

    # Test activities
    print("--- ACTIVITY field ---")
    activity_data = activities.get_activities(limit=5)
    summarize("ACTIVITIES", activity_data)

    specific_activity_data = activities.get_activity("25043824747")
    print(f"\nSPECIFIC ACTIVITY: {specific_activity_data}")

    # Test health
    print(f"\n--- HEALTH field ---")
    heart_data = health.get_heart_rate("2026-11-10")
    summarize("HEART DATA", heart_data)

    sleep_data = health.get_sleep("2026-11-10")
    summarize("SLEEP", sleep_data)

    hrv_data = health.get_hrv("2026-11-10")
    summarize("HRV", hrv_data)


if __name__ == "__main__":
    main()