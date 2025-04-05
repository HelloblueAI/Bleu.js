import json
import os
from datetime import datetime
from typing import Dict, List, Literal, Optional

import boto3
import requests

HealthStatus = Literal["healthy", "unhealthy"]


class InfrastructureHealthCheck:
    def __init__(self):
        self.eb = boto3.client("elasticbeanstalk", region_name="us-west-2")
        self.ec2 = boto3.client("ec2", region_name="us-west-2")
        self.elb = boto3.client("elbv2", region_name="us-west-2")
        self.environment_name = "bleujs-api-prod"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "overall_status": "pending",
        }

    def log_test(self, test_name: str, status: str, details: Dict):
        """Log test results."""
        self.results["tests"].append(
            {
                "name": test_name,
                "status": status,
                "details": details,
                "timestamp": datetime.now().isoformat(),
            }
        )

    def check_eb_health(self) -> Dict:
        """Check Elastic Beanstalk environment health."""
        try:
            response = self.eb.describe_environments(
                EnvironmentNames=[self.environment_name]
            )
            env = response["Environments"][0]
            status = {
                "health": env["Health"],
                "status": env["Status"],
                "version_label": env["VersionLabel"],
                "cname": env["CNAME"],
            }
            self.log_test("eb_health", "success", status)
            return status
        except Exception as e:
            self.log_test("eb_health", "failure", {"error": str(e)})
            return {"error": str(e)}

    def check_ec2_instances(self) -> Dict:
        """Check EC2 instances status."""
        try:
            # Get instance IDs from EB environment
            env_resources = self.eb.describe_environment_resources(
                EnvironmentName=self.environment_name
            )
            instance_ids = [
                i["Id"] for i in env_resources["EnvironmentResources"]["Instances"]
            ]

            # Check instance status
            instances = self.ec2.describe_instances(InstanceIds=instance_ids)
            instance_status = []
            for reservation in instances["Reservations"]:
                for instance in reservation["Instances"]:
                    status = {
                        "instance_id": instance["InstanceId"],
                        "state": instance["State"]["Name"],
                        "type": instance["InstanceType"],
                        "az": instance["Placement"]["AvailabilityZone"],
                    }
                    instance_status.append(status)

            self.log_test("ec2_instances", "success", {"instances": instance_status})
            return {"instances": instance_status}
        except Exception as e:
            self.log_test("ec2_instances", "failure", {"error": str(e)})
            return {"error": str(e)}

    def check_load_balancer(self) -> Dict:
        """Check Load Balancer health."""
        try:
            # Get load balancer ARN from EB environment
            env_resources = self.eb.describe_environment_resources(
                EnvironmentName=self.environment_name
            )
            lb_name = env_resources["EnvironmentResources"]["LoadBalancers"][0]["Name"]

            # Get load balancer details
            lbs = self.elb.describe_load_balancers(Names=[lb_name])
            lb = lbs["LoadBalancers"][0]

            # Get target group health
            target_groups = self.elb.describe_target_groups(
                LoadBalancerArn=lb["LoadBalancerArn"]
            )

            health_status = []
            for tg in target_groups["TargetGroups"]:
                health = self.elb.describe_target_health(
                    TargetGroupArn=tg["TargetGroupArn"]
                )
                health_status.append(
                    {
                        "target_group": tg["TargetGroupName"],
                        "targets": health["TargetHealthDescriptions"],
                    }
                )

            status = {
                "load_balancer": lb["LoadBalancerName"],
                "dns_name": lb["DNSName"],
                "state": lb["State"]["Code"],
                "target_groups": health_status,
            }

            self.log_test("load_balancer", "success", status)
            return status
        except Exception as e:
            self.log_test("load_balancer", "failure", {"error": str(e)})
            return {"error": str(e)}

    def check_api_endpoints(self) -> Dict:
        """Check API endpoints health."""
        try:
            # Get environment URL
            env = self.eb.describe_environments(
                EnvironmentNames=[self.environment_name]
            )["Environments"][0]
            base_url = f"https://{env['CNAME']}"

            endpoints = ["/health", "/v1/subscriptions/plans", "/v1/auth/validate"]

            results = {}
            for endpoint in endpoints:
                try:
                    response = requests.get(f"{base_url}{endpoint}")
                    results[endpoint] = {
                        "status_code": response.status_code,
                        "response_time": response.elapsed.total_seconds(),
                    }
                except requests.RequestException as e:
                    results[endpoint] = {"error": str(e)}

            self.log_test("api_endpoints", "success", results)
            return results
        except Exception as e:
            self.log_test("api_endpoints", "failure", {"error": str(e)})
            return {"error": str(e)}

    def generate_report(self) -> Dict:
        """Generate comprehensive health check report."""
        try:
            # Run all checks and store results
            health_status = {
                "elastic_beanstalk": self.check_eb_health(),
                "ec2_instances": self.check_ec2_instances(),
                "load_balancer": self.check_load_balancer(),
                "api_endpoints": self.check_api_endpoints(),
            }

            # Add health status to results
            self.results["health_status"] = health_status

            # Determine overall status
            all_success = all(
                test["status"] == "success" for test in self.results["tests"]
            )
            self.results["overall_status"] = "healthy" if all_success else "unhealthy"

            # Save report
            report_path = (
                f"reports/health_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            os.makedirs("reports", exist_ok=True)
            with open(report_path, "w") as f:
                json.dump(self.results, f, indent=2)

            return self.results
        except Exception as e:
            return {"error": "Failed to generate report", "details": str(e)}


def check_elastic_beanstalk_health() -> HealthStatus:
    """Check Elastic Beanstalk environment health."""
    try:
        eb = boto3.client("elasticbeanstalk")
        response = eb.describe_environments(EnvironmentNames=["bleujs-api-prod"])
        if response["Environments"][0]["Health"] == "Green":
            return "healthy"
        return "unhealthy"
    except Exception as e:
        print(f"Error checking Elastic Beanstalk health: {str(e)}")
        return "unhealthy"


def check_ec2_health() -> HealthStatus:
    """Check EC2 instance health."""
    try:
        ec2 = boto3.client("ec2")
        response = ec2.describe_instance_status()
        for status in response["InstanceStatuses"]:
            if status["InstanceStatus"]["Status"] != "ok":
                return "unhealthy"
        return "healthy"
    except Exception as e:
        print(f"Error checking EC2 health: {str(e)}")
        return "unhealthy"


def check_load_balancer_health() -> HealthStatus:
    """Check Load Balancer health."""
    try:
        elb = boto3.client("elbv2")
        eb = boto3.client("elasticbeanstalk")

        # Get environment resources to find target group
        env_resources = eb.describe_environment_resources(
            EnvironmentName="bleujs-api-prod"
        )

        # Get target group ARN from environment resources
        target_groups = env_resources["EnvironmentResources"]["TargetGroups"]
        if not target_groups:
            print("No target groups found in environment")
            return "unhealthy"

        target_group_arn = target_groups[0]["Name"]

        # Now check the health
        response = elb.describe_target_health(TargetGroupArn=target_group_arn)

        for target in response["TargetHealthDescriptions"]:
            if target["TargetHealth"]["State"] != "healthy":
                return "unhealthy"
        return "healthy"
    except Exception as e:
        print(f"Error checking Load Balancer health: {str(e)}")
        return "unhealthy"


def check_api_health() -> HealthStatus:
    """Check API endpoint health."""
    try:
        response = requests.get(
            "https://bleujs-api-prod.eba-5k3sxpbd.us-west-2.elasticbeanstalk.com/health"
        )
        if response.status_code == 200:
            return "healthy"
        return "unhealthy"
    except Exception as e:
        print(f"Error checking API health: {str(e)}")
        return "unhealthy"


def run_health_checks():
    """Run all infrastructure health checks and return results."""
    try:
        # Get health check results
        eb_health = check_elastic_beanstalk_health()
        ec2_status = check_ec2_health()
        lb_status = check_load_balancer_health()
        api_status = check_api_health()

        # Print results
        print("Infrastructure Health Check Results:")
        print(f"Elastic Beanstalk Health: {eb_health}")
        print(f"EC2 Instance Status: {ec2_status}")
        print(f"Load Balancer Status: {lb_status}")
        print(f"API Endpoint Status: {api_status}")

        # Return overall health status
        health_results = {
            "eb_health": eb_health,
            "ec2_status": ec2_status,
            "lb_status": lb_status,
            "api_status": api_status,
        }
        return all(status == "healthy" for status in health_results.values())
    except Exception as e:
        print(f"Error running health checks: {str(e)}")
        return False


if __name__ == "__main__":
    run_health_checks()
