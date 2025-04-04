import boto3
import click
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()


def create_iam_user():
    """Create IAM user with necessary permissions for Bleu.js"""
    # Use root credentials for IAM operations
    iam = boto3.client(
        "iam",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION"),
    )

    # Create IAM user
    try:
        user_name = "bleujs-app"
        iam.create_user(UserName=user_name)
        print(f"Created IAM user: {user_name}")

        # Create access key
        access_key_response = iam.create_access_key(UserName=user_name)
        access_key = access_key_response["AccessKey"]["AccessKeyId"]
        secret_key = access_key_response["AccessKey"]["SecretAccessKey"]

        print("\nAccess Key ID:", access_key)
        print("Secret Access Key:", secret_key)
        print("\nIMPORTANT: Save these credentials securely!")

        # Create policy for Bleu.js
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{os.getenv('S3_BUCKET')}",
                        f"arn:aws:s3:::{os.getenv('S3_BUCKET')}/*",
                    ],
                },
                {
                    "Effect": "Allow",
                    "Action": ["ses:SendEmail", "ses:SendRawEmail"],
                    "Resource": "*",
                },
                {
                    "Effect": "Allow",
                    "Action": ["rds-db:connect"],
                    "Resource": [
                        f"arn:aws:rds-db:{os.getenv('AWS_REGION')}:{os.getenv('AWS_ACCOUNT_ID')}:dbuser:*/*"
                    ],
                },
            ],
        }

        policy_name = "bleujs-app-policy"
        policy_response = iam.create_policy(
            PolicyName=policy_name, PolicyDocument=str(policy_document)
        )
        policy_arn = policy_response["Policy"]["Arn"]
        print(f"\nCreated policy: {policy_name}")

        # Attach policy to user
        iam.attach_user_policy(UserName=user_name, PolicyArn=policy_arn)
        print(f"Attached policy to user: {user_name}")

        return {"access_key": access_key, "secret_key": secret_key}

    except ClientError as e:
        print(f"Error creating IAM user: {e}")
        return None


def create_domain_management_user():
    """Create IAM user with necessary permissions for domain management"""
    iam = boto3.client(
        "iam",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION"),
    )

    try:
        user_name = "bleujs-domain-manager"
        iam.create_user(UserName=user_name)
        print(f"Created IAM user: {user_name}")

        # Create access key
        access_key_response = iam.create_access_key(UserName=user_name)
        access_key = access_key_response["AccessKey"]["AccessKeyId"]
        secret_key = access_key_response["AccessKey"]["SecretAccessKey"]

        print("\nAccess Key ID:", access_key)
        print("Secret Access Key:", secret_key)
        print("\nIMPORTANT: Save these credentials securely!")

        # Create policy for domain management
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "route53:CreateHostedZone",
                        "route53:DeleteHostedZone",
                        "route53:GetHostedZone",
                        "route53:ListHostedZones",
                        "route53:ChangeResourceRecordSets",
                        "route53:ListResourceRecordSets",
                        "acm:RequestCertificate",
                        "acm:DescribeCertificate",
                        "acm:ListCertificates",
                        "cloudfront:UpdateDistribution",
                        "cloudfront:GetDistribution",
                        "cloudfront:ListDistributions"
                    ],
                    "Resource": "*"
                }
            ]
        }

        policy_name = "bleujs-domain-management-policy"
        policy_response = iam.create_policy(
            PolicyName=policy_name,
            PolicyDocument=str(policy_document)
        )
        policy_arn = policy_response["Policy"]["Arn"]
        print(f"\nCreated policy: {policy_name}")

        # Attach policy to user
        iam.attach_user_policy(UserName=user_name, PolicyArn=policy_arn)
        print(f"Attached policy to user: {user_name}")

        return {"access_key": access_key, "secret_key": secret_key}

    except ClientError as e:
        print(f"Error creating domain management user: {e}")
        return None


@click.group()
def cli():
    """AWS setup CLI for Bleu.js"""
    pass


@cli.command()
def setup_aws():
    """Set up AWS resources for Bleu.js"""
    credentials = create_iam_user()
    if credentials:
        print("\nAWS setup completed successfully!")
        print("\nUpdate your .env file with these credentials:")
        print(f"AWS_ACCESS_KEY_ID={credentials['access_key']}")
        print(f"AWS_SECRET_ACCESS_KEY={credentials['secret_key']}")


@cli.command()
def setup_domain_user():
    """Set up IAM user for domain management"""
    credentials = create_domain_management_user()
    if credentials:
        print("\nDomain management user setup completed successfully!")
        print("\nUpdate your .env file with these credentials:")
        print(f"AWS_ACCESS_KEY_ID={credentials['access_key']}")
        print(f"AWS_SECRET_ACCESS_KEY={credentials['secret_key']}")


if __name__ == "__main__":
    cli()
