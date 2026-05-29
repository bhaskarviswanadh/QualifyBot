"""
Logging utilities for the AI Lead Qualification Bot.
"""

import os
import sys
from typing import Optional
from loguru import logger

from config.settings import logging_config

def setup_logging():
    """Setup logging configuration."""
    # Remove default handler
    logger.remove()
    
    # Add console handler
    if logging_config.enable_console_logging:
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=logging_config.log_level,
            colorize=True
        )
    
    # Add file handler
    if logging_config.enable_file_logging:
        # Ensure log directory exists
        os.makedirs(os.path.dirname(logging_config.log_file), exist_ok=True)
        
        logger.add(
            logging_config.log_file,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            level=logging_config.log_level,
            rotation="10 MB",
            retention="30 days",
            compression="zip"
        )
    
    logger.info("Logging setup completed")

def get_logger(name: str):
    """Get a logger instance for a specific module."""
    return logger.bind(name=name)

def log_function_call(func):
    """Decorator to log function calls."""
    def wrapper(*args, **kwargs):
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} returned {result}")
            return result
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {e}")
            raise
    return wrapper

def log_performance(func):
    """Decorator to log function performance."""
    import time
    from functools import wraps
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            logger.info(f"{func.__name__} took {end_time - start_time:.3f} seconds")
            return result
        except Exception as e:
            end_time = time.time()
            logger.error(f"{func.__name__} failed after {end_time - start_time:.3f} seconds: {e}")
            raise
    return wrapper

class ConversationLogger:
    """Logger specifically for conversation tracking."""
    
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.logger = logger.bind(conversation_id=conversation_id)
    
    def log_message(self, role: str, content: str, metadata: Optional[dict] = None):
        """Log a conversation message."""
        self.logger.info(f"Message [{role}]: {content[:100]}{'...' if len(content) > 100 else ''}")
        if metadata:
            self.logger.debug(f"Message metadata: {metadata}")
    
    def log_prediction(self, prediction: dict):
        """Log a prediction result."""
        self.logger.info(f"Prediction: intent={prediction.get('intent')}, score={prediction.get('score')}")
        self.logger.debug(f"Full prediction: {prediction}")
    
    def log_error(self, error: str, context: Optional[dict] = None):
        """Log an error in the conversation."""
        self.logger.error(f"Conversation error: {error}")
        if context:
            self.logger.debug(f"Error context: {context}")
    
    def log_conversation_end(self, summary: dict):
        """Log conversation end with summary."""
        self.logger.info(f"Conversation ended: {summary}")

# Initialize logging on module import
setup_logging()
