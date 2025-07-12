#!/usr/bin/env python3
import os

import boto3
import click
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()


class DomainManager:
    def __init__(self):
        self.route53 = boto3.client("route53")
        self.cloudfront = boto3.client("cloudfront")
        self.acm = boto3.client("acm")
        self.domain = "bleujs.org"
        self.region = os.getenv("AWS_REGION", "us-west-2")

    def create_hosted_zone(self):
        """Create a Route 53 hosted zone for the domain"""
        try:
            response = self.route53.create_hosted_zone(
                Name=self.domain,
                CallerReference=str(hash(self.domain + str(os.getpid()))),
                HostedZoneConfig={
                    "Comment": f"Hosted zone for {self.domain}",
                    "PrivateZone": False,
                },
            )
            print(f"Created hosted zone: {response['HostedZone']['Id']}")
            return response["HostedZone"]["Id"]
        except ClientError as e:
            print(f"Error creating hosted zone: {e}")
            return None

    def request_certificate(self):
        """Request an SSL certificate from AWS Certificate Manager"""
        try:
            response = self.acm.request_certificate(
                DomainName=self.domain,
                ValidationMethod="DNS",
                SubjectAlternativeNames=[f"www.{self.domain}"],
                Tags=[
                    {"Key": "Project", "Value": "Bleu.js"},
                    {"Key": "Environment", "Value": "Production"},
                ],
            )
            print(f"Requested certificate: {response['CertificateArn']}")
            return response["CertificateArn"]
        except ClientError as e:
            print(f"Error requesting certificate: {e}")
            return None

    def create_dns_records(self, hosted_zone_id, distribution_domain):
        """Create DNS records for the domain"""
        try:
            # Create A record for the root domain
            self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    "Changes": [
                        {
                            "Action": "CREATE",
                            "ResourceRecordSet": {
                                "Name": self.domain,
                                "Type": "A",
                                "AliasTarget": {
                                    "HostedZoneId": "Z2FDTNDATAQYW2ZL",  # CloudFront
                                    # hosted zone ID
                                    "DNSName": distribution_domain,
                                    "EvaluateTargetHealth": False,
                                },
                            },
                        },
                        {
                            "Action": "CREATE",
                            "ResourceRecordSet": {
                                "Name": f"www.{self.domain}",
                                "Type": "A",
                                "AliasTarget": {
                                    "HostedZoneId": "Z2FDTNDATAQYW2ZL",
                                    "DNSName": distribution_domain,
                                    "EvaluateTargetHealth": False,
                                },
                            },
                        },
                    ]
                },
            )
            print("Created DNS records")
        except ClientError as e:
            print(f"Error creating DNS records: {e}")

    def update_cloudfront_distribution(self, distribution_id, certificate_arn):
        """Update CloudFront distribution with the SSL certificate"""
        try:
            # Get current distribution config
            response = self.cloudfront.get_distribution(Id=distribution_id)
            config = response["Distribution"]["DistributionConfig"]

            # Update the config with the new certificate
            config["ViewerCertificate"] = {
                "ACMCertificateArn": certificate_arn,
                "SSLSupportMethod": "sni-only",
                "MinimumProtocolVersion": "TLSv1.2_2021",
            }

            # Update the distribution
            self.cloudfront.update_distribution(
                Id=distribution_id, DistributionConfig=config
            )
            print(
                f"Updated CloudFront distribution {distribution_id} "
                f"with SSL certificate"
            )
        except ClientError as e:
            print(f"Error updating CloudFront distribution: {e}")


@click.group()
def cli():
    """Domain setup CLI for Bleu.js"""


@cli.command()
def setup_domain():
    """Set up domain configuration for Bleu.js"""
    manager = DomainManager()

    click.echo("Starting domain setup...")

    # Create hosted zone
    click.echo("Creating hosted zone...")
    hosted_zone_id = manager.create_hosted_zone()
    if not hosted_zone_id:
        click.echo("Failed to create hosted zone")
        return

    # Request SSL certificate
    click.echo("Requesting SSL certificate...")
    certificate_arn = manager.request_certificate()
    if not certificate_arn:
        click.echo("Failed to request SSL certificate")
        return

    # Get CloudFront distribution ID from environment
    distribution_id = os.getenv("CLOUDFRONT_DISTRIBUTION_ID")
    if not distribution_id:
        click.echo("CLOUDFRONT_DISTRIBUTION_ID not found in environment")
        return

    # Get CloudFront domain name
    try:
        response = manager.cloudfront.get_distribution(Id=distribution_id)
        distribution_domain = response["Distribution"]["DomainName"]
    except ClientError as e:
        click.echo(f"Error getting CloudFront distribution: {e}")
        return

    # Update CloudFront with SSL certificate
    click.echo("Updating CloudFront distribution...")
    manager.update_cloudfront_distribution(distribution_id, certificate_arn)

    # Create DNS records
    click.echo("Creating DNS records...")
    manager.create_dns_records(hosted_zone_id, distribution_domain)

    click.echo("Domain setup completed!")


if __name__ == "__main__":
    cli()
