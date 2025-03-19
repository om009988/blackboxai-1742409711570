from elasticsearch import Elasticsearch, exceptions
from typing import List, Dict, Optional, Any
import logging
from datetime import datetime
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ElasticManager:
    def __init__(self, host: str = None, port: int = None):
        """Initialize Elasticsearch connection.
        
        Args:
            host: Elasticsearch host (default from env)
            port: Elasticsearch port (default from env)
        """
        self.host = host or os.getenv('ELASTICSEARCH_HOST', 'localhost')
        self.port = port or int(os.getenv('ELASTICSEARCH_PORT', 9200))
        self.index_name = 'emails'
        self.client = None
        self._connect()
        self._setup_index()

    def _connect(self) -> None:
        """Establish connection to Elasticsearch."""
        try:
            self.client = Elasticsearch([{
                'host': self.host,
                'port': self.port,
                'scheme': 'http'
            }])
            if not self.client.ping():
                raise ConnectionError("Failed to connect to Elasticsearch")
            logger.info("Successfully connected to Elasticsearch")
        except Exception as e:
            logger.error(f"Failed to connect to Elasticsearch: {str(e)}")
            raise

    def _setup_index(self) -> None:
        """Create and configure the emails index if it doesn't exist."""
        try:
            if not self.client.indices.exists(index=self.index_name):
                # Define email mapping
                mapping = {
                    "mappings": {
                        "properties": {
                            "uid": {"type": "keyword"},
                            "subject": {
                                "type": "text",
                                "analyzer": "standard",
                                "fields": {
                                    "keyword": {"type": "keyword"}
                                }
                            },
                            "sender": {
                                "type": "text",
                                "fields": {
                                    "keyword": {"type": "keyword"}
                                }
                            },
                            "recipient": {
                                "type": "text",
                                "fields": {
                                    "keyword": {"type": "keyword"}
                                }
                            },
                            "content": {"type": "text"},
                            "timestamp": {"type": "date"},
                            "categories": {"type": "keyword"},
                            "is_read": {"type": "boolean"},
                            "is_flagged": {"type": "boolean"},
                            "is_interested": {"type": "boolean"},
                            "account": {"type": "keyword"},
                            "suggestions": {
                                "type": "nested",
                                "properties": {
                                    "text": {"type": "text"},
                                    "confidence": {"type": "float"}
                                }
                            }
                        }
                    },
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    }
                }
                
                self.client.indices.create(
                    index=self.index_name,
                    body=mapping
                )
                logger.info(f"Created index '{self.index_name}' with mapping")
        except Exception as e:
            logger.error(f"Failed to setup Elasticsearch index: {str(e)}")
            raise

    async def index_email(self, email: Dict[str, Any]) -> str:
        """Index a single email document.
        
        Args:
            email: Email data dictionary
            
        Returns:
            Document ID
        """
        try:
            result = self.client.index(
                index=self.index_name,
                document=email,
                id=email.get('uid')
            )
            logger.debug(f"Indexed email with ID: {result['_id']}")
            return result['_id']
        except Exception as e:
            logger.error(f"Failed to index email: {str(e)}")
            raise

    async def bulk_index_emails(self, emails: List[Dict[str, Any]]) -> None:
        """Bulk index multiple email documents.
        
        Args:
            emails: List of email data dictionaries
        """
        try:
            if not emails:
                return

            actions = []
            for email in emails:
                action = {
                    "_index": self.index_name,
                    "_id": email.get('uid'),
                    "_source": email
                }
                actions.append(action)

            if actions:
                self.client.bulk(operations=actions)
                logger.info(f"Bulk indexed {len(emails)} emails")
        except Exception as e:
            logger.error(f"Failed to bulk index emails: {str(e)}")
            raise

    async def search_emails(
        self,
        query: str = None,
        categories: List[str] = None,
        is_interested: bool = None,
        account: str = None,
        from_date: str = None,
        to_date: str = None,
        page: int = 1,
        size: int = 50
    ) -> Dict[str, Any]:
        """Search for emails with various filters.
        
        Args:
            query: Search query string
            categories: List of categories to filter by
            is_interested: Filter by interest status
            account: Filter by email account
            from_date: Start date for range filter
            to_date: End date for range filter
            page: Page number for pagination
            size: Number of results per page
            
        Returns:
            Dictionary containing search results and metadata
        """
        try:
            # Build search query
            must_conditions = []
            
            if query:
                must_conditions.append({
                    "multi_match": {
                        "query": query,
                        "fields": ["subject^2", "content", "sender"]
                    }
                })

            if categories:
                must_conditions.append({
                    "terms": {"categories": categories}
                })

            if is_interested is not None:
                must_conditions.append({
                    "term": {"is_interested": is_interested}
                })

            if account:
                must_conditions.append({
                    "term": {"account.keyword": account}
                })

            if from_date or to_date:
                range_filter = {"timestamp": {}}
                if from_date:
                    range_filter["timestamp"]["gte"] = from_date
                if to_date:
                    range_filter["timestamp"]["lte"] = to_date
                must_conditions.append({"range": range_filter})

            # Construct final query
            search_body = {
                "query": {
                    "bool": {
                        "must": must_conditions if must_conditions else [{"match_all": {}}]
                    }
                },
                "sort": [{"timestamp": "desc"}],
                "from": (page - 1) * size,
                "size": size
            }

            # Execute search
            result = self.client.search(
                index=self.index_name,
                body=search_body
            )

            # Format response
            hits = result["hits"]["hits"]
            total = result["hits"]["total"]["value"]
            
            emails = [hit["_source"] for hit in hits]
            
            return {
                "emails": emails,
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size
            }

        except Exception as e:
            logger.error(f"Failed to search emails: {str(e)}")
            raise

    async def get_email(self, email_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single email by ID.
        
        Args:
            email_id: Email document ID
            
        Returns:
            Email document or None if not found
        """
        try:
            result = self.client.get(
                index=self.index_name,
                id=email_id
            )
            return result["_source"]
        except exceptions.NotFoundError:
            return None
        except Exception as e:
            logger.error(f"Failed to get email {email_id}: {str(e)}")
            raise

    async def update_email(self, email_id: str, update_data: Dict[str, Any]) -> bool:
        """Update email document fields.
        
        Args:
            email_id: Email document ID
            update_data: Dictionary of fields to update
            
        Returns:
            True if update was successful
        """
        try:
            self.client.update(
                index=self.index_name,
                id=email_id,
                body={"doc": update_data}
            )
            return True
        except exceptions.NotFoundError:
            return False
        except Exception as e:
            logger.error(f"Failed to update email {email_id}: {str(e)}")
            raise

    async def delete_email(self, email_id: str) -> bool:
        """Delete an email document.
        
        Args:
            email_id: Email document ID
            
        Returns:
            True if deletion was successful
        """
        try:
            self.client.delete(
                index=self.index_name,
                id=email_id
            )
            return True
        except exceptions.NotFoundError:
            return False
        except Exception as e:
            logger.error(f"Failed to delete email {email_id}: {str(e)}")
            raise

    def close(self) -> None:
        """Close the Elasticsearch connection."""
        if self.client:
            self.client.close()