
"""
Handles Garmin health and recovery endpoints.
"""

class HealthAPI:

    def __init__(self, client):
        self.client = client

    def get_heart_rate(self, date):
        return self.client.call(
            "/wellness-service/wellness/dailyHeartRate/",
            query={"date": date}
        )

    def get_sleep(self, date):
        return self.client.call(
            f"/sleep-service/sleep/dailySleep/",
            query={"date": date}
        )
    
    def get_hrv(self, date):
        return self.client.call(
            f"/hrv-service/hrv/{date}"
        )
