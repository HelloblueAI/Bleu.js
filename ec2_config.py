import boto3
import os
from dotenv import load_dotenv

load_dotenv()


def read_user_data():
    """Read the user data script"""
    with open("user_data.sh", "r") as file:
        return file.read()


def launch_instance():
    """Launch EC2 instance with user data script"""
    ec2 = boto3.client(
        "ec2",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION"),
    )

    # Get the latest Amazon Linux 2 AMI
    response = ec2.describe_images(
        Filters=[
            {"Name": "name", "Values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
            {"Name": "state", "Values": ["available"]},
        ],
        Owners=["amazon"],
    )

    # Sort by creation date and get the latest
    latest_ami = sorted(
        response["Images"], key=lambda x: x["CreationDate"], reverse=True
    )[0]

    # Launch instance
    response = ec2.run_instances(
        ImageId=latest_ami["ImageId"],
        InstanceType="t2.micro",
        KeyName="bleu-js-key",
        MinCount=1,
        MaxCount=1,
        UserData=read_user_data(),
        TagSpecifications=[
            {
                "ResourceType": "instance",
                "Tags": [{"Key": "Name", "Value": "bleu-js-server"}],
            }
        ],
        SecurityGroupIds=[os.getenv("SECURITY_GROUP_ID")],
    )

    instance_id = response["Instances"][0]["InstanceId"]
    print(f"Launched instance {instance_id}")

    # Wait for the instance to be running
    waiter = ec2.get_waiter("instance_running")
    waiter.wait(InstanceIds=[instance_id])

    # Get the public IP address
    response = ec2.describe_instances(InstanceIds=[instance_id])
    public_ip = response["Reservations"][0]["Instances"][0]["PublicIpAddress"]
    print(f"Instance public IP: {public_ip}")

    return instance_id, public_ip


def get_instance_public_ip(instance_id: str) -> str:
    """Get the public IP address of an EC2 instance."""
    ec2_client = boto3.client("ec2")
    response = ec2_client.describe_instances(InstanceIds=[instance_id])
    return response["Reservations"][0]["Instances"][0]["PublicIpAddress"]


def get_instance_private_ip(instance_id: str) -> str:
    """Get the private IP address of an EC2 instance."""
    ec2_client = boto3.client("ec2")
    response = ec2_client.describe_instances(InstanceIds=[instance_id])
    return response["Reservations"][0]["Instances"][0]["PrivateIpAddress"]


if __name__ == "__main__":
    instance_id, public_ip = launch_instance()
    print("\nInstance launched successfully!")
    print(f"Instance ID: {instance_id}")
    print(f"Public IP: {public_ip}")
