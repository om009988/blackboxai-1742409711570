from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime

from imap_sync.email_fetcher import EmailFetcher
from imap_sync.imap_client import IMAPConnection
from database.elastic_manager import ElasticManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Onebox Email Aggregator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class EmailBase(BaseModel):
    subject: str
    sender: str
    recipient: str
    content: str
    timestamp: str

class EmailResponse(EmailBase):
    id: str
    category: Optional[str] = None
    is_interested: bool = False

class MarkInterestedRequest(BaseModel):
    email_id: str
    interested: bool

class SyncResponse(BaseModel):
    status: str
    message: str
    count: Optional[int] = None

# Global service instances
email_fetcher: Optional[EmailFetcher] = None
elastic_manager: Optional[ElasticManager] = None

async def get_email_fetcher() -> EmailFetcher:
    """Get or create EmailFetcher instance."""
    global email_fetcher
    if email_fetcher is None:
        # Get credentials from environment variables
        host = os.getenv("IMAP_SERVER")
        username = os.getenv("EMAIL_ADDRESS")
        password = os.getenv("EMAIL_PASSWORD")
        
        if not all([host, username, password]):
            raise ValueError("Missing required environment variables for IMAP connection")
        
        # Create email fetcher with callback for new emails
        email_fetcher = EmailFetcher(
            host=host,
            username=username,
            password=password,
            on_new_email=handle_new_email,
            idle_timeout=300,  # 5 minutes
            sync_interval=600   # 10 minutes
        )
    return email_fetcher

async def get_elastic_manager() -> ElasticManager:
    """Get or create ElasticManager instance."""
    global elastic_manager
    if elastic_manager is None:
        elastic_manager = ElasticManager()
    return elastic_manager

async def handle_new_email(email_data: Dict):
    """Handle new email callback from EmailFetcher."""
    try:
        manager = await get_elastic_manager()
        await manager.index_email(email_data)
        logger.info(f"Indexed new email: {email_data.get('subject', 'No subject')}")
    except Exception as e:
        logger.error(f"Failed to handle new email: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    try:
        # Initialize Elasticsearch
        elastic = await get_elastic_manager()
        logger.info("Elasticsearch service initialized")

        # Initialize and start email fetcher
        fetcher = await get_email_fetcher()
        await fetcher.start()
        logger.info("Email fetcher service started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    try:
        # Stop email fetcher
        global email_fetcher
        if email_fetcher:
            await email_fetcher.stop()
            logger.info("Email fetcher service stopped")

        # Close Elasticsearch connection
        global elastic_manager
        if elastic_manager:
            elastic_manager.close()
            logger.info("Elasticsearch connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Onebox Email Aggregator API",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/emails", response_model=List[EmailResponse])
async def get_emails(
    query: Optional[str] = None,
    categories: Optional[List[str]] = None,
    is_interested: Optional[bool] = None,
    page: int = 1,
    size: int = 50,
    elastic: ElasticManager = Depends(get_elastic_manager)
):
    """Get emails with optional filtering and search."""
    try:
        result = await elastic.search_emails(
            query=query,
            categories=categories,
            is_interested=is_interested,
            page=page,
            size=size
        )
        return result["emails"]
    except Exception as e:
        logger.error(f"Error fetching emails: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch emails")

@app.post("/sync", response_model=SyncResponse)
async def sync_emails(
    background_tasks: BackgroundTasks,
    fetcher: EmailFetcher = Depends(get_email_fetcher),
    elastic: ElasticManager = Depends(get_elastic_manager)
):
    """Trigger manual email synchronization."""
    try:
        # Fetch emails
        emails = await fetcher.full_sync()
        
        # Index emails in Elasticsearch
        if emails:
            await elastic.bulk_index_emails(emails)
            
        return {
            "status": "success",
            "message": "Email synchronization completed",
            "count": len(emails)
        }
    except Exception as e:
        logger.error(f"Error during email sync: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sync emails")

@app.get("/email/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    elastic: ElasticManager = Depends(get_elastic_manager)
):
    """Get a specific email by ID."""
    try:
        email = await elastic.get_email(email_id)
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        return email
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/suggest-replies/{email_id}")
async def suggest_replies(
    email_id: str,
    fetcher: EmailFetcher = Depends(get_email_fetcher)
):
    """Generate AI-powered reply suggestions for an email."""
    try:
        # TODO: Implement AI-powered reply suggestions
        # This will be implemented when the AI categorization service is ready
        return {"suggestions": []}
    except Exception as e:
        logger.error(f"Error generating reply suggestions for email {email_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")

@app.post("/mark-interested")
async def mark_interested(
    request: MarkInterestedRequest,
    elastic: ElasticManager = Depends(get_elastic_manager)
):
    """Mark an email as interested/not interested."""
    try:
        success = await elastic.update_email(
            request.email_id,
            {"is_interested": request.interested}
        )
        if not success:
            raise HTTPException(status_code=404, detail="Email not found")
            
        # TODO: Trigger Slack notification when email is marked as interested
        
        return {
            "status": "success",
            "message": "Email interest status updated"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating interest status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update interest status")

if __name__ == "__main__":
    uvicorn.run("main_server:app", host="0.0.0.0", port=8000, reload=True)