#!/usr/bin/env python3
import boto3
import click
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()


class Deployer:
    def __init__(self):
        self.ec2 = boto3.client("ec2")
        self.rds = boto3.client("rds")
        self.s3 = boto3.client("s3")
        self.cloudfront = boto3.client("cloudfront")
        self.route53 = boto3.client("route53")

    def create_ec2_instance(self):
        """Create EC2 instance for application hosting"""
        try:
            response = self.ec2.run_instances(
                ImageId="ami-0c55b159cbfafe1f0",  # Amazon Linux 2 AMI
                InstanceType="t2.micro",
                MinCount=1,
                MaxCount=1,
                SecurityGroups=["bleujs-sg"],
                UserData=self.get_user_data(),
                TagSpecifications=[
                    {
                        "ResourceType": "instance",
                        "Tags": [{"Key": "Name", "Value": "bleujs-app"}],
                    }
                ],
            )
            instance_id = response["Instances"][0]["InstanceId"]
            print(f"Created EC2 instance: {instance_id}")
            return instance_id
        except ClientError as e:
            print(f"Error creating EC2 instance: {e}")
            return None

    def create_rds_instance(self):
        """Create RDS instance for database"""
        try:
            response = self.rds.create_db_instance(
                DBName="bleujs",
                DBInstanceIdentifier="bleujs-db",
                AllocatedStorage=20,
                DBInstanceClass="db.t3.micro",
                Engine="postgres",
                MasterUsername="postgres",
                MasterUserPassword=os.getenv("DB_PASSWORD"),
                VpcSecurityGroupIds=["sg-xxxxx"],
                BackupRetentionPeriod=7,
                MultiAZ=False,
                PubliclyAccessible=True,
                Tags=[{"Key": "Project", "Value": "Bleu.js"}],
            )
            print(
                f"Created RDS instance: {response['DBInstance']['DBInstanceIdentifier']}"
            )
            return response["DBInstance"]["DBInstanceIdentifier"]
        except ClientError as e:
            print(f"Error creating RDS instance: {e}")
            return None

    def setup_s3_bucket(self):
        """Create and configure S3 bucket"""
        bucket_name = os.getenv("S3_BUCKET")
        try:
            self.s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": "us-west-2"},
            )

            # Enable versioning
            self.s3.put_bucket_versioning(
                Bucket=bucket_name, VersioningConfiguration={"Status": "Enabled"}
            )

            # Enable encryption
            self.s3.put_bucket_encryption(
                Bucket=bucket_name,
                ServerSideEncryptionConfiguration={
                    "Rules": [
                        {
                            "ApplyServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }
                    ]
                },
            )

            print(f"Created and configured S3 bucket: {bucket_name}")
            return bucket_name
        except ClientError as e:
            print(f"Error setting up S3 bucket: {e}")
            return None

    def setup_cloudfront(self, bucket_name):
        """Create CloudFront distribution"""
        try:
            response = self.cloudfront.create_distribution(
                DistributionConfig={
                    "Origins": {
                        "Quantity": 1,
                        "Items": [
                            {
                                "Id": "S3Origin",
                                "DomainName": f"{bucket_name}.s3.amazonaws.com",
                                "S3OriginConfig": {"OriginAccessIdentity": ""},
                            }
                        ],
                    },
                    "DefaultCacheBehavior": {
                        "TargetOriginId": "S3Origin",
                        "ViewerProtocolPolicy": "redirect-to-https",
                        "AllowedMethods": {
                            "Quantity": 2,
                            "Items": ["GET", "HEAD"],
                            "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
                        },
                        "ForwardedValues": {
                            "QueryString": False,
                            "Cookies": {"Forward": "none"},
                        },
                        "MinTTL": 0,
                        "DefaultTTL": 86400,
                        "MaxTTL": 31536000,
                    },
                    "Enabled": True,
                    "Comment": "Bleu.js CDN",
                    "DefaultRootObject": "index.html",
                    "PriceClass": "PriceClass_100",
                }
            )
            print(f"Created CloudFront distribution: {response['Distribution']['Id']}")
            return response["Distribution"]["Id"]
        except ClientError as e:
            print(f"Error creating CloudFront distribution: {e}")
            return None

    def get_user_data(self):
        """Generate EC2 user data script"""
        return """#!/bin/bash
yum update -y
yum install -y docker
service docker start
systemctl enable docker
usermod -a -G docker ec2-user
docker pull bleujs/app:latest
docker run -d -p 80:8000 bleujs/app:latest
"""


@click.group()
def cli():
    """Deployment CLI for Bleu.js"""
    pass


@cli.command()
def deploy_all():
    """Deploy all infrastructure components"""
    deployer = Deployer()

    click.echo("Starting deployment...")

    # Create RDS instance
    click.echo("Creating RDS instance...")
    if not deployer.create_rds_instance():
        click.echo("Failed to create RDS instance")
        return

    # Create EC2 instance
    click.echo("Creating EC2 instance...")
    if not deployer.create_ec2_instance():
        click.echo("Failed to create EC2 instance")
        return

    # Setup S3 and CloudFront
    click.echo("Setting up S3 and CloudFront...")
    bucket = deployer.setup_s3_bucket()
    if bucket:
        deployer.setup_cloudfront(bucket)
    else:
        click.echo("Failed to set up S3 bucket")
        return

    click.echo("Deployment completed!")


@cli.command()
def create_ec2():
    """Create EC2 instance only"""
    deployer = Deployer()
    deployer.create_ec2_instance()


@cli.command()
def create_rds():
    """Create RDS instance only"""
    deployer = Deployer()
    deployer.create_rds_instance()


@cli.command()
def setup_cdn():
    """Setup S3 and CloudFront only"""
    deployer = Deployer()
    bucket = deployer.setup_s3_bucket()
    if bucket:
        deployer.setup_cloudfront(bucket)


def cleanup_resources():
    """Clean up AWS resources."""
    try:
        # Delete RDS instance
        rds_client = boto3.client("rds")
        response = rds_client.describe_db_instances()
        if response["DBInstances"]:
            DB_INSTANCE_IDENTIFIER = response["DBInstances"][0]["DBInstanceIdentifier"]
            rds_client.delete_db_instance(
                DBInstanceIdentifier=DB_INSTANCE_IDENTIFIER, SkipFinalSnapshot=True
            )
            print(f"Deleting RDS instance {DB_INSTANCE_IDENTIFIER}...")
            waiter = rds_client.get_waiter("db_instance_deleted")
            waiter.wait(DBInstanceIdentifier=DB_INSTANCE_IDENTIFIER)
            print("RDS instance deleted successfully")

        # Delete EC2 instance
        ec2_client = boto3.client("ec2")
        response = ec2_client.describe_instances(
            Filters=[{"Name": "tag:Name", "Values": ["bleujs-app"]}]
        )
        if response["Reservations"]:
            EC2_INSTANCE_ID = response["Reservations"][0]["Instances"][0]["InstanceId"]
            ec2_client.terminate_instances(InstanceIds=[EC2_INSTANCE_ID])
            print(f"Terminating EC2 instance {EC2_INSTANCE_ID}...")
            waiter = ec2_client.get_waiter("instance_terminated")
            waiter.wait(InstanceIds=[EC2_INSTANCE_ID])
            print("EC2 instance terminated successfully")
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")


if __name__ == "__main__":
    cli()
