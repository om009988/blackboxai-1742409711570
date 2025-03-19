from slack_sdk.webhook import WebhookClient
from typing import Dict, Optional
import logging
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SlackNotifier:
    def __init__(self, webhook_url: str):
        """Initialize Slack webhook client."""
        self.webhook_client = WebhookClient(webhook_url)
        self.default_channel = "#email-notifications"

    async def send_notification(
        self,
        email_data: Dict,
        notification_type: str = "interested",
        channel: Optional[str] = None
    ) -> bool:
        """Send notification to Slack channel."""
        try:
            # Format the message based on notification type
            if notification_type == "interested":
                blocks = self._format_interested_email_blocks(email_data)
            else:
                blocks = self._format_generic_email_blocks(email_data)

            # Send the message
            response = self.webhook_client.send(
                text="New Email Notification",
                blocks=blocks,
                channel=channel or self.default_channel
            )

            if response.status_code == 200:
                logger.info(f"Successfully sent Slack notification for email: {email_data.get('subject', 'No subject')}")
                return True
            else:
                logger.error(f"Failed to send Slack notification. Status: {response.status_code}, Response: {response.body}")
                return False

        except Exception as e:
            logger.error(f"Error sending Slack notification: {str(e)}")
            return False

    def _format_interested_email_blocks(self, email_data: Dict) -> List[Dict]:
        """Format message blocks for interested email notification."""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎯 New Interested Email!",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*From:*\n{email_data.get('sender', 'Unknown')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Subject:*\n{email_data.get('subject', 'No subject')}"
                    }
                ]
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Category:*\n{email_data.get('category', 'Uncategorized')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Received:*\n{email_data.get('timestamp', datetime.utcnow().isoformat())}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Preview:*\n{self._truncate_content(email_data.get('content', 'No content'))}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Email",
                            "emoji": True
                        },
                        "url": f"{os.getenv('APP_URL', 'http://localhost:3000')}/email/{email_data.get('id', '')}"
                    }
                ]
            }
        ]

    def _format_generic_email_blocks(self, email_data: Dict) -> List[Dict]:
        """Format message blocks for generic email notification."""
        return [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📧 New Email Notification",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*From:*\n{email_data.get('sender', 'Unknown')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Subject:*\n{email_data.get('subject', 'No subject')}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Preview:*\n{self._truncate_content(email_data.get('content', 'No content'))}"
                }
            }
        ]

    def _truncate_content(self, content: str, max_length: int = 200) -> str:
        """Truncate content to specified length."""
        if len(content) <= max_length:
            return content
        return content[:max_length] + "..."

    @classmethod
    def from_env(cls) -> 'SlackNotifier':
        """Create a SlackNotifier instance from environment variables."""
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        if not webhook_url:
            raise ValueError("SLACK_WEBHOOK_URL environment variable is required")
        return cls(webhook_url)

class WebhookManager:
    def __init__(self, webhook_urls: Optional[Dict[str, str]] = None):
        """Initialize webhook manager with optional webhook URLs."""
        self.webhook_urls = webhook_urls or {}

    async def send_webhook(
        self,
        webhook_name: str,
        email_data: Dict,
        event_type: str = "interested"
    ) -> bool:
        """Send webhook notification to specified endpoint."""
        try:
            if webhook_name not in self.webhook_urls:
                logger.error(f"Webhook URL not found for name: {webhook_name}")
                return False

            webhook_url = self.webhook_urls[webhook_name]
            
            # Prepare webhook payload
            payload = {
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "email_data": {
                    "id": email_data.get("id"),
                    "subject": email_data.get("subject"),
                    "sender": email_data.get("sender"),
                    "category": email_data.get("category"),
                    "timestamp": email_data.get("timestamp")
                }
            }

            # Send webhook request using aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info(f"Successfully sent webhook notification to {webhook_name}")
                        return True
                    else:
                        logger.error(f"Failed to send webhook to {webhook_name}. Status: {response.status}")
                        return False

        except Exception as e:
            logger.error(f"Error sending webhook notification: {str(e)}")
            return False

    def add_webhook(self, name: str, url: str):
        """Add a new webhook URL."""
        self.webhook_urls[name] = url
        logger.info(f"Added webhook URL for {name}")

    def remove_webhook(self, name: str):
        """Remove a webhook URL."""
        if name in self.webhook_urls:
            del self.webhook_urls[name]
            logger.info(f"Removed webhook URL for {name}")

    @classmethod
    def from_env(cls) -> 'WebhookManager':
        """Create a WebhookManager instance from environment variables."""
        # Load webhook URLs from environment variable
        webhook_urls_str = os.getenv('WEBHOOK_URLS', '{}')
        try:
            webhook_urls = json.loads(webhook_urls_str)
            return cls(webhook_urls)
        except json.JSONDecodeError:
            logger.error("Failed to parse WEBHOOK_URLS environment variable")
            return cls()