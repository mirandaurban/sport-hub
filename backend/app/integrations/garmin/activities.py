
"""
Handles Garmin activity endpoints
"""

class ActivitiesAPI:

    def __init__(self, client):
        self.client = client

    def get_activities(self, start=0, limit=20):
        """Retrieve a list of activities."""

        return self.client.call(
            "/activitylist-service/activities/search/activities",
            query={
                "start": start,
                "limit": limit
            }
        )

    def get_activity(self, activity_id):
        """Retrieve details for a specific activity."""

        return self.client.call(
            f"/activity-service/activity/{activity_id}/workouts"
        )
