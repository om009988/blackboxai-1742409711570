from transformers import AutoTokenizer, AutoModel, pipeline
from sentence_transformers import SentenceTransformer
import torch
from typing import List, Dict, Optional
import logging
import numpy as np
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AICategorization:
    def __init__(self):
        """Initialize AI models and configurations."""
        try:
            # Load models
            self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            self.model = AutoModel.from_pretrained('bert-base-uncased')
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize zero-shot classification pipeline
            self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli"
            )

            # Define email categories
            self.categories = [
                "Product Inquiry",
                "Support Request",
                "Sales Lead",
                "Partnership Opportunity",
                "Spam",
                "Newsletter",
                "Internal Communication",
                "Other"
            ]

            logger.info("AI Categorization service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {str(e)}")
            raise

    def _preprocess_text(self, text: str) -> str:
        """Preprocess email text for model input."""
        # Basic text cleaning
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = ' '.join(text.split())  # Remove extra whitespace
        return text

    def _get_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text using sentence transformer."""
        try:
            return self.sentence_transformer.encode(text, convert_to_tensor=True)
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return None

    async def categorize_email(self, subject: str, content: str) -> Dict[str, Any]:
        """Categorize email using zero-shot classification."""
        try:
            # Combine subject and content
            full_text = f"{subject}\n{content}"
            preprocessed_text = self._preprocess_text(full_text)

            # Perform zero-shot classification
            result = self.classifier(
                preprocessed_text,
                candidate_labels=self.categories,
                hypothesis_template="This email is about {}."
            )

            # Get top category and confidence
            top_category = result['labels'][0]
            confidence = result['scores'][0]

            return {
                'category': top_category,
                'confidence': float(confidence),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error categorizing email: {str(e)}")
            return {
                'category': 'Other',
                'confidence': 0.0,
                'timestamp': datetime.utcnow().isoformat()
            }

    async def generate_reply_suggestions(
        self,
        email_content: str,
        product_info: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """Generate contextual reply suggestions."""
        try:
            # Preprocess email content
            preprocessed_content = self._preprocess_text(email_content)

            # Generate base responses based on email category
            category_result = await self.categorize_email("", preprocessed_content)
            category = category_result['category']

            # Template-based responses
            templates = {
                "Product Inquiry": [
                    "Thank you for your interest in our products. I'd be happy to provide more information about {product}.",
                    "Thanks for reaching out about {product}. Let me share some key features that might interest you.",
                    "I appreciate your inquiry about {product}. Here's what you need to know:"
                ],
                "Support Request": [
                    "I understand you're experiencing an issue. Let me help you resolve this.",
                    "Thank you for bringing this to our attention. Here's how we can address your concern:",
                    "I'm sorry you're having trouble. Let's work together to solve this."
                ],
                "Sales Lead": [
                    "Thank you for considering our solutions. I'd love to schedule a call to discuss your needs.",
                    "I appreciate your interest. Let me show you how we can help achieve your goals.",
                    "Thanks for reaching out. Would you be available for a brief discussion about your requirements?"
                ],
                "Partnership Opportunity": [
                    "Thank you for considering a partnership. We're always excited to explore collaboration opportunities.",
                    "I appreciate your interest in partnering with us. Let's discuss how we can work together.",
                    "Thanks for reaching out about a potential partnership. I'd love to learn more about your vision."
                ]
            }

            # Get relevant templates
            relevant_templates = templates.get(category, [
                "Thank you for your message. I'll get back to you shortly.",
                "I appreciate you reaching out. Let me look into this for you.",
                "Thanks for your email. I'll be happy to help you with this."
            ])

            # Customize templates with product info if available
            if product_info and category == "Product Inquiry":
                product_name = product_info.get('name', 'our product')
                relevant_templates = [
                    template.format(product=product_name)
                    for template in relevant_templates
                ]

            # Add timestamp and confidence to each suggestion
            suggestions = [
                {
                    'text': template,
                    'confidence': 0.8 - (i * 0.1),  # Decreasing confidence for each alternative
                    'timestamp': datetime.utcnow().isoformat()
                }
                for i, template in enumerate(relevant_templates[:3])
            ]

            return suggestions
        except Exception as e:
            logger.error(f"Error generating reply suggestions: {str(e)}")
            return [{
                'text': "Thank you for your message. I'll get back to you shortly.",
                'confidence': 0.5,
                'timestamp': datetime.utcnow().isoformat()
            }]

    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of email text."""
        try:
            sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            
            result = sentiment_analyzer(self._preprocess_text(text))[0]
            
            return {
                'sentiment': result['label'],
                'confidence': float(result['score']),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {
                'sentiment': 'NEUTRAL',
                'confidence': 0.5,
                'timestamp': datetime.utcnow().isoformat()
            }

    @classmethod
    def from_env(cls) -> 'AICategorization':
        """Create an AICategorization instance from environment variables."""
        return cls()

    def __del__(self):
        """Cleanup when the instance is destroyed."""
        try:
            # Clear CUDA cache if using GPU
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")