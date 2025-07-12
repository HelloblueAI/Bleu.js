"""Email service implementation."""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional

from ..config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL

    async def send_welcome_email(
        self, email: str, api_key: str, plan: str, documentation_url: str
    ) -> None:
        """Send welcome email to new subscribers."""
        try:
            subject = f"Welcome to Bleu.js {plan.title()} Plan!"

            # Create HTML content
            html_content = self._create_welcome_email_content(
                plan=plan, api_key=api_key, documentation_url=documentation_url
            )

            # Create plain text content
            text_content = self._create_welcome_email_text_content(
                plan=plan, api_key=api_key, documentation_url=documentation_url
            )

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = email

            # Attach both HTML and plain text versions
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Welcome email sent to {email}")

        except Exception as e:
            logger.error(f"Error sending welcome email: {str(e)}")
            raise

    async def send_usage_alert(self, email: str, usage_percentage: float) -> None:
        """Send usage alert email when API calls are running low."""
        try:
            subject = "Bleu.js API Usage Alert"

            # Create HTML content
            html_content = self._create_usage_alert_content(usage_percentage)

            # Create plain text content
            text_content = self._create_usage_alert_text_content(usage_percentage)

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = email

            # Attach both HTML and plain text versions
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Usage alert email sent to {email}")

        except Exception as e:
            logger.error(f"Error sending usage alert email: {str(e)}")
            raise

    def _create_welcome_email_content(
        self, plan: str, api_key: str, documentation_url: str
    ) -> str:
        """Create HTML content for welcome email."""
        return f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6;
                           color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto;
                                padding: 20px; }}
                    .header {{ background-color: #1a56db; color: white;
                              padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .api-key {{ background-color: #f3f4f6; padding: 15px;
                               border-radius: 5px; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 10px 20px;
                              background-color: #1a56db; color: white;
                              text-decoration: none; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Bleu.js {plan.title()} Plan!</h1>
                    </div>
                    <div class="content">
                        <p>Thank you for choosing Bleu.js! We're excited to
                           have you on board.</p>
                        <p>Your account has been set up successfully with the
                           following details:</p>
                        <ul>
                            <li>Plan: {plan.title()}</li>
                            <li>API Key: <div class="api-key">{api_key}</div></li>
                        </ul>
                        <p>To get started, please visit our documentation:</p>
                        <p><a href="{documentation_url}" class="button">
                           View Documentation</a></p>
                        <p>If you have any questions or need assistance, our
                           support team is here to help.</p>
                        <p>Best regards,<br>The Bleu.js Team</p>
                    </div>
                </div>
            </body>
        </html>
        """

    def _create_welcome_email_text_content(
        self, plan: str, api_key: str, documentation_url: str
    ) -> str:
        """Create plain text content for welcome email."""
        return f"""
        Welcome to Bleu.js {plan.title()} Plan!

        Thank you for choosing Bleu.js! We're excited to have you on board.

        Your account has been set up successfully with the following details:
        - Plan: {plan.title()}
        - API Key: {api_key}

        To get started, please visit our documentation:
        {documentation_url}

        If you have any questions or need assistance, our support team is here to help.

        Best regards,
        The Bleu.js Team
        """

    def _create_usage_alert_content(self, usage_percentage: float) -> str:
        """Create HTML content for usage alert email."""
        return f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6;
                           color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto;
                                padding: 20px; }}
                    .header {{ background-color: #dc2626; color: white;
                              padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .button {{ display: inline-block; padding: 10px 20px;
                              background-color: #1a56db; color: white;
                              text-decoration: none; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>API Usage Alert</h1>
                    </div>
                    <div class="content">
                        <p>Your Bleu.js API usage has reached "
                        f"{usage_percentage}% of your monthly limit.</p>
                        <p>To ensure uninterrupted service, please consider:</p>
                        <ul>
                            <li>Upgrading your plan for higher limits</li>
                            <li>Optimizing your API usage</li>
                            <li>Contacting our support team for assistance</li>
                        </ul>
                        <p><a href="https://bleujs.org/pricing" class="button">
                           View Plans</a></p>
                        <p>Best regards,<br>The Bleu.js Team</p>
                    </div>
                </div>
            </body>
        </html>
        """

    def _create_usage_alert_text_content(self, usage_percentage: float) -> str:
        """Create plain text content for usage alert email."""
        return f"""
        API Usage Alert

        Your Bleu.js API usage has reached {usage_percentage}% "
        f"of your monthly limit.</p>

        To ensure uninterrupted service, please consider:
        - Upgrading your plan for higher limits
        - Optimizing your API usage
        - Contacting our support team for assistance

        View our plans: https://bleujs.org/pricing

        Best regards,
        The Bleu.js Team
        """

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """
        Send an email to the specified recipient.

        Args:
            recipient: Email address of the recipient
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            attachments: Optional list of attachment dictionaries

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = recipient

            # Attach plain text content
            msg.attach(MIMEText(body, "plain"))

            # Attach HTML content if provided
            if html_body:
                msg.attach(MIMEText(html_body, "html"))

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent to {recipient}")
            return True

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
