"""
Configuration settings for the AI Lead Qualification Bot.
"""

import os
from typing import Dict, Any, List
from dataclasses import dataclass

@dataclass
class ModelConfig:
    """Configuration for LLM and embedding models."""
    
    # LLM Configuration
    llm_model_name: str = "microsoft/DialoGPT-medium"
    llm_max_length: int = 2048
    llm_temperature: float = 0.7
    llm_top_p: float = 0.9
    
    # Embedding Configuration
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    
    # Vector Database Configuration
    vector_db_path: str = "data/vector_store"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_retrieval: int = 5

@dataclass
class PredictiveModelConfig:
    """Configuration for the predictive scoring model."""
    
    model_type: str = "lightgbm"
    model_path: str = "models/trained_models/lead_scorer.pkl"
    
    # Feature engineering
    min_samples_for_training: int = 100
    feature_importance_threshold: float = 0.01
    
    # Scoring parameters
    score_thresholds: Dict[str, int] = None
    
    def __post_init__(self):
        if self.score_thresholds is None:
            self.score_thresholds = {
                "high_priority": 80,
                "medium_priority": 60,
                "low_priority": 40
            }

@dataclass
class CRMConfig:
    """Configuration for CRM integrations."""
    
    # HubSpot Configuration
    hubspot_api_key: str = os.getenv("HUBSPOT_API_KEY", "")
    hubspot_base_url: str = "https://api.hubapi.com"
    
    # Salesforce Configuration
    salesforce_api_key: str = os.getenv("SALESFORCE_API_KEY", "")
    salesforce_base_url: str = "https://your-instance.salesforce.com"
    
    # Mock mode for development
    mock_mode: bool = True

@dataclass
class ConversationConfig:
    """Configuration for conversation management."""
    
    max_conversation_length: int = 50
    conversation_timeout_minutes: int = 30
    
    # Qualification questions
    required_fields: List[str] = None
    
    def __post_init__(self):
        if self.required_fields is None:
            self.required_fields = [
                "role", "company", "industry", "team_size", 
                "current_tools", "budget", "timeline", "problem"
            ]

@dataclass
class LoggingConfig:
    """Configuration for logging and monitoring."""
    
    log_level: str = "INFO"
    log_file: str = "logs/lead_qualification_bot.log"
    enable_console_logging: bool = True
    enable_file_logging: bool = True

@dataclass
class AppConfig:
    """Main application configuration."""
    
    # App settings
    app_name: str = "AI Lead Qualification Bot"
    app_version: str = "1.0.0"
    debug_mode: bool = False
    
    # Gradio settings
    gradio_port: int = 7860
    gradio_share: bool = False
    gradio_debug: bool = False
    
    # Data paths
    data_dir: str = "data"
    models_dir: str = "models"
    logs_dir: str = "logs"
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")

# Global configuration instances
model_config = ModelConfig()
predictive_config = PredictiveModelConfig()
crm_config = CRMConfig()
conversation_config = ConversationConfig()
logging_config = LoggingConfig()
app_config = AppConfig()

# Feature flags
FEATURE_FLAGS = {
    "enable_predictive_scoring": True,
    "enable_crm_integration": True,
    "enable_vector_search": True,
    "enable_conversation_history": True,
    "enable_debug_mode": False
}

# Intent classification labels
INTENT_LABELS = [
    "buy_soon",
    "considering", 
    "researching",
    "not_interested"
]

# Recommended actions
RECOMMENDED_ACTIONS = [
    "schedule_demo",
    "send_pricing",
    "nurture_email", 
    "send_ROI_report",
    "follow_up_call",
    "send_case_study"
]

# CRM tags for categorization
CRM_TAGS = [
    "enterprise",
    "smb", 
    "startup",
    "high_priority",
    "medium_priority",
    "low_priority",
    "salesforce_migration",
    "hubspot_migration",
    "new_customer",
    "existing_customer"
]

def get_config() -> Dict[str, Any]:
    """Get all configuration as a dictionary."""
    return {
        "model": model_config,
        "predictive": predictive_config,
        "crm": crm_config,
        "conversation": conversation_config,
        "logging": logging_config,
        "app": app_config,
        "feature_flags": FEATURE_FLAGS,
        "intent_labels": INTENT_LABELS,
        "recommended_actions": RECOMMENDED_ACTIONS,
        "crm_tags": CRM_TAGS
    }

def validate_config() -> bool:
    """Validate the configuration settings."""
    try:
        # Check required directories exist
        required_dirs = [
            app_config.data_dir,
            app_config.models_dir,
            app_config.logs_dir
        ]
        
        for directory in required_dirs:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
        
        # Validate model paths
        if not os.path.exists(predictive_config.model_path):
            os.makedirs(os.path.dirname(predictive_config.model_path), exist_ok=True)
        
        # Validate logging
        if logging_config.enable_file_logging:
            os.makedirs(os.path.dirname(logging_config.log_file), exist_ok=True)
        
        return True
        
    except Exception as e:
        print(f"Configuration validation failed: {e}")
        return False
