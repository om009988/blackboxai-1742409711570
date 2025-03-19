import imaplib
import email
from email.header import decode_header
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time
import ssl
from imapclient import IMAPClient

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class IMAPConnection:
    def __init__(
        self,
        host: str,
        username: str,
        password: str,
        use_ssl: bool = True,
        port: int = 993,
        retry_limit: int = 3,
        retry_delay: int = 5
    ):
        """Initialize IMAP connection parameters.
        
        Args:
            host: IMAP server hostname
            username: Email account username
            password: Email account password
            use_ssl: Whether to use SSL connection (default True)
            port: IMAP server port (default 993 for SSL)
            retry_limit: Number of connection retry attempts
            retry_delay: Delay between retries in seconds
        """
        self.host = host
        self.username = username
        self.password = password
        self.use_ssl = use_ssl
        self.port = port
        self.retry_limit = retry_limit
        self.retry_delay = retry_delay
        self.client: Optional[IMAPClient] = None
        self._connect()

    def _connect(self) -> None:
        """Establish connection to IMAP server with retry logic."""
        attempts = 0
        while attempts < self.retry_limit:
            try:
                logger.info(f"Attempting to connect to {self.host}")
                self.client = IMAPClient(
                    self.host,
                    port=self.port,
                    use_uid=True,
                    ssl=self.use_ssl
                )
                self.client.login(self.username, self.password)
                logger.info("Successfully connected to IMAP server")
                return
            except (imaplib.IMAP4.error, ssl.SSLError, ConnectionError) as e:
                attempts += 1
                logger.error(f"Connection attempt {attempts} failed: {str(e)}")
                if attempts < self.retry_limit:
                    logger.info(f"Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)
                else:
                    logger.error("Max retry attempts reached")
                    raise ConnectionError(f"Failed to connect to IMAP server: {str(e)}")

    def reconnect(self) -> None:
        """Reconnect to the IMAP server if connection is lost."""
        logger.info("Attempting to reconnect to IMAP server")
        try:
            if self.client:
                try:
                    self.client.logout()
                except:
                    pass
            self._connect()
        except Exception as e:
            logger.error(f"Reconnection failed: {str(e)}")
            raise

    def ensure_connection(self) -> None:
        """Ensure connection is active, reconnect if necessary."""
        try:
            if self.client:
                # Try to check connection by selecting INBOX
                self.client.select_folder('INBOX')
            else:
                self.reconnect()
        except Exception as e:
            logger.warning(f"Connection check failed: {str(e)}")
            self.reconnect()

    def enable_idle(self) -> None:
        """Enable IDLE mode for real-time updates."""
        try:
            self.ensure_connection()
            self.client.select_folder('INBOX')
            logger.info("IDLE mode enabled")
            return self.client.idle_start()
        except Exception as e:
            logger.error(f"Failed to enable IDLE mode: {str(e)}")
            raise

    def check_idle(self, timeout: int = 30) -> List[Dict]:
        """Check for updates in IDLE mode.
        
        Args:
            timeout: Timeout in seconds for IDLE check
            
        Returns:
            List of responses from the server
        """
        try:
            responses = self.client.idle_check(timeout=timeout)
            return responses
        except Exception as e:
            logger.error(f"Error checking IDLE updates: {str(e)}")
            self.reconnect()
            return []

    def stop_idle(self) -> None:
        """Stop IDLE mode."""
        try:
            self.client.idle_done()
            logger.info("IDLE mode disabled")
        except Exception as e:
            logger.error(f"Error stopping IDLE mode: {str(e)}")
            self.reconnect()

    def fetch_recent_emails(self, days: int = 30) -> List[Dict[str, any]]:
        """Fetch emails from the last specified number of days.
        
        Args:
            days: Number of days to look back
            
        Returns:
            List of email data dictionaries
        """
        try:
            self.ensure_connection()
            self.client.select_folder('INBOX')
            
            # Calculate date criteria
            date = (datetime.now() - timedelta(days=days)).strftime("%d-%b-%Y")
            messages = self.client.search(['SINCE', date])
            
            emails = []
            for uid, message_data in self.client.fetch(messages, ['RFC822']).items():
                try:
                    email_message = email.message_from_bytes(message_data[b'RFC822'])
                    
                    # Decode subject
                    subject = decode_header(email_message["Subject"])[0]
                    subject = subject[0] if isinstance(subject[0], str) else subject[0].decode()
                    
                    # Get sender
                    from_header = decode_header(email_message["From"])[0]
                    sender = from_header[0] if isinstance(from_header[0], str) else from_header[0].decode()
                    
                    # Get date
                    date_str = email_message["Date"]
                    
                    # Get content
                    content = ""
                    if email_message.is_multipart():
                        for part in email_message.walk():
                            if part.get_content_type() == "text/plain":
                                content = part.get_payload(decode=True).decode()
                                break
                    else:
                        content = email_message.get_payload(decode=True).decode()
                    
                    emails.append({
                        "uid": uid,
                        "subject": subject,
                        "sender": sender,
                        "date": date_str,
                        "content": content
                    })
                except Exception as e:
                    logger.error(f"Error processing email {uid}: {str(e)}")
                    continue
                    
            return emails
        except Exception as e:
            logger.error(f"Error fetching recent emails: {str(e)}")
            self.reconnect()
            return []

    def close(self) -> None:
        """Close the IMAP connection."""
        try:
            if self.client:
                self.client.logout()
                logger.info("IMAP connection closed")
        except Exception as e:
            logger.error(f"Error closing connection: {str(e)}")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()