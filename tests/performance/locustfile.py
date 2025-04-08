from locust import HttpUser, between, task


class BleuJSUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        """Login and get token"""
        response = self.client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"},
        )
        self.token = response.json()["token"]

    @task
    def get_health(self):
        """Check health endpoint"""
        self.client.get("/health")

    @task(3)
    def process_image(self):
        """Process image endpoint"""
        headers = {"Authorization": f"Bearer {self.token}"}
        with open("tests/test_images/sample.jpg", "rb") as f:
            self.client.post("/api/process", files={"image": f}, headers=headers)

    @task(2)
    def get_status(self):
        """Get processing status"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/api/status/123", headers=headers)

    @task(1)
    def get_history(self):
        """Get processing history"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/api/history", headers=headers)
