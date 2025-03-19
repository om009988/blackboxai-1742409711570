import asyncio
import logging
from typing import List, Dict, Optional, Callable
from datetime import datetime, timedelta
from .imap_client import IMAPConnection
import email.utils
import pytz
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailFetcher:
    def __init__(
        self,
        host: str,
        username: str,
        password: str,
        on_new_email: Optional[Callable[[Dict], None]] = None,
        idle_timeout: int = 300,
        sync_interval: int = 600
    ):
        """Initialize EmailFetcher with IMAP connection parameters.
        
        Args:
            host: IMAP server hostname
            username: Email account username
            password: Email account password
            on_new_email: Callback function for new email notifications
            idle_timeout: IDLE mode timeout in seconds
            sync_interval: Full sync interval in seconds
        """
        self.connection = IMAPConnection(host, username, password)
        self.on_new_email = on_new_email
        self.idle_timeout = idle_timeout
        self.sync_interval = sync_interval
        self.last_sync = datetime.min.replace(tzinfo=pytz.UTC)
        self._running = False
        self._last_seen_uids = set()

    async def start(self):
        """Start the email fetching service."""
        self._running = True
        try:
            # Initial sync
            await self.full_sync()
            
            # Start background tasks
            await asyncio.gather(
                self._idle_loop(),
                self._periodic_sync()
            )
        except Exception as e:
            logger.error(f"Error in email fetching service: {str(e)}")
            self._running = False
            raise

    async def stop(self):
        """Stop the email fetching service."""
        self._running = False
        self.connection.close()

    def _process_email(self, email_data: Dict) -> Dict:
        """Process raw email data into a structured format.
        
        Args:
            email_data: Raw email data dictionary
            
        Returns:
            Processed email dictionary with normalized fields
        """
        try:
            # Parse date to UTC
            date_str = email_data.get('date', '')
            if date_str:
                parsed_date = email.utils.parsedate_to_datetime(date_str)
                if parsed_date.tzinfo is None:
                    parsed_date = parsed_date.replace(tzinfo=pytz.UTC)
            else:
                parsed_date = datetime.now(pytz.UTC)

            # Clean and structure the email data
            processed_email = {
                'uid': email_data.get('uid'),
                'subject': email_data.get('subject', '').strip() or '(No Subject)',
                'sender': email_data.get('sender', '').strip() or '(No Sender)',
                'content': email_data.get('content', '').strip() or '(No Content)',
                'timestamp': parsed_date.isoformat(),
                'categories': [],  # To be filled by AI categorization
                'is_read': False,
                'is_flagged': False,
                'is_interested': False
            }

            return processed_email
        except Exception as e:
            logger.error(f"Error processing email: {str(e)}")
            raise

    async def full_sync(self) -> List[Dict]:
        """Perform a full synchronization of recent emails.
        
        Returns:
            List of processed email dictionaries
        """
        try:
            logger.info("Starting full email sync")
            raw_emails = self.connection.fetch_recent_emails()
            
            processed_emails = []
            new_uids = set()
            
            for email_data in raw_emails:
                try:
                    uid = email_data.get('uid')
                    if uid not in self._last_seen_uids:
                        processed_email = self._process_email(email_data)
                        processed_emails.append(processed_email)
                        new_uids.add(uid)
                        
                        # Notify if callback is registered
                        if self.on_new_email:
                            await self.on_new_email(processed_email)
                except Exception as e:
                    logger.error(f"Error processing email during sync: {str(e)}")
                    continue
            
            self._last_seen_uids.update(new_uids)
            self.last_sync = datetime.now(pytz.UTC)
            
            logger.info(f"Full sync completed. Processed {len(processed_emails)} new emails")
            return processed_emails
            
        except Exception as e:
            logger.error(f"Error during full sync: {str(e)}")
            raise

    async def _idle_loop(self):
        """Main IDLE loop for real-time email notifications."""
        while self._running:
            try:
                # Start IDLE mode
                self.connection.enable_idle()
                
                while self._running:
                    # Check for new messages
                    responses = self.connection.check_idle(timeout=self.idle_timeout)
                    
                    if responses:
                        # Temporarily exit IDLE mode
                        self.connection.stop_idle()
                        
                        # Fetch new emails
                        await self.full_sync()
                        
                        # Re-enable IDLE mode
                        self.connection.enable_idle()
                    
                    # Small delay to prevent tight loop
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error in IDLE loop: {str(e)}")
                # Wait before retrying
                await asyncio.sleep(5)
                continue

    async def _periodic_sync(self):
        """Periodic full synchronization task."""
        while self._running:
            try:
                await asyncio.sleep(self.sync_interval)
                
                # Check if sync is needed (based on last sync time)
                time_since_sync = datetime.now(pytz.UTC) - self.last_sync
                if time_since_sync.total_seconds() >= self.sync_interval:
                    await self.full_sync()
                    
            except Exception as e:
                logger.error(f"Error in periodic sync: {str(e)}")
                continue

    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()