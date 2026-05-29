"""
Predictive model for lead scoring and intent classification using LightGBM.
"""

import os
import pickle
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

from config.settings import predictive_config
from utils.logging import get_logger

logger = get_logger(__name__)

@dataclass
class LeadFeatures:
    """Feature extraction for lead scoring."""
    
    # Conversation features
    message_count: int = 0
    avg_message_length: float = 0.0
    question_count: int = 0
    engagement_score: float = 0.0
    
    # Intent signals
    budget_mentioned: bool = False
    timeline_mentioned: bool = False
    pain_points_clear: bool = False
    decision_maker: bool = False
    urgency_indicators: int = 0
    
    # Demographic features
    team_size: Optional[int] = None
    company_size_category: str = "unknown"
    industry: str = "unknown"
    role_authority: float = 0.0
    
    # Behavioral features
    pages_visited: int = 0
    trial_usage: float = 0.0
    email_opens: int = 0
    demo_requested: bool = False
    
    # Product interest
    feature_questions: int = 0
    pricing_questions: int = 0
    integration_questions: int = 0
    competitor_mentions: int = 0

class LeadScoringModel:
    """LightGBM-based model for lead scoring and intent classification."""
    
    def __init__(self, model_path: str = None):
        """Initialize the predictive model."""
        self.model_path = model_path or predictive_config.model_path
        self.model = None
        self.intent_encoder = LabelEncoder()
        self.feature_names = []
        self.is_trained = False
        
        # Create model directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        self._load_or_initialize()
    
    def _load_or_initialize(self):
        """Load existing model or initialize new one."""
        if os.path.exists(self.model_path):
            try:
                self._load_model()
                logger.info("Loaded existing predictive model")
            except Exception as e:
                logger.error(f"Error loading model: {e}")
                self._initialize_model()
        else:
            self._initialize_model()
    
    def _initialize_model(self):
        """Initialize a new LightGBM model."""
        self.model = lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            num_leaves=31,
            random_state=42,
            verbose=-1
        )
        self.is_trained = False
        logger.info("Initialized new LightGBM model")
    
    def _load_model(self):
        """Load the trained model from disk."""
        with open(self.model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.intent_encoder = model_data['intent_encoder']
        self.feature_names = model_data['feature_names']
        self.is_trained = True
    
    def _save_model(self):
        """Save the trained model to disk."""
        model_data = {
            'model': self.model,
            'intent_encoder': self.intent_encoder,
            'feature_names': self.feature_names
        }
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info("Model saved successfully")
    
    def extract_features(self, conversation_data: Dict[str, Any]) -> LeadFeatures:
        """Extract features from conversation and lead data."""
        features = LeadFeatures()
        
        # Extract conversation features
        messages = conversation_data.get('messages', [])
        features.message_count = len(messages)
        
        if messages:
            message_lengths = [len(msg.get('content', '')) for msg in messages]
            features.avg_message_length = np.mean(message_lengths)
            features.question_count = sum(1 for msg in messages if '?' in msg.get('content', ''))
        
        # Extract intent signals
        conversation_text = ' '.join([msg.get('content', '') for msg in messages]).lower()
        
        # Budget signals
        budget_keywords = ['budget', 'cost', 'price', 'pricing', 'expensive', 'cheap', 'afford']
        features.budget_mentioned = any(keyword in conversation_text for keyword in budget_keywords)
        
        # Timeline signals
        timeline_keywords = ['timeline', 'deadline', 'soon', 'urgent', 'asap', 'month', 'quarter']
        features.timeline_mentioned = any(keyword in conversation_text for keyword in timeline_keywords)
        
        # Pain points
        pain_keywords = ['problem', 'issue', 'challenge', 'difficult', 'struggle', 'need']
        features.pain_points_clear = any(keyword in conversation_text for keyword in pain_keywords)
        
        # Decision maker signals
        decision_keywords = ['decision', 'approve', 'final', 'manager', 'director', 'vp', 'ceo']
        features.decision_maker = any(keyword in conversation_text for keyword in decision_keywords)
        
        # Urgency indicators
        urgency_keywords = ['urgent', 'asap', 'immediately', 'quick', 'fast', 'now']
        features.urgency_indicators = sum(1 for keyword in urgency_keywords if keyword in conversation_text)
        
        # Extract demographic features
        lead_info = conversation_data.get('lead_info', {})
        
        team_size = lead_info.get('team_size')
        if team_size:
            try:
                features.team_size = int(team_size)
                if features.team_size > 1000:
                    features.company_size_category = "enterprise"
                elif features.team_size > 100:
                    features.company_size_category = "mid_market"
                else:
                    features.company_size_category = "smb"
            except (ValueError, TypeError):
                pass
        
        features.industry = lead_info.get('industry', 'unknown')
        
        # Role authority scoring
        role = lead_info.get('role', '').lower()
        authority_keywords = {
            'ceo': 1.0, 'cto': 0.9, 'vp': 0.8, 'director': 0.7, 'manager': 0.6,
            'head': 0.7, 'lead': 0.6, 'senior': 0.5, 'junior': 0.3
        }
        
        for keyword, score in authority_keywords.items():
            if keyword in role:
                features.role_authority = score
                break
        
        # Extract behavioral features
        behavioral_data = conversation_data.get('behavioral_data', {})
        features.pages_visited = behavioral_data.get('pages_visited', 0)
        features.trial_usage = behavioral_data.get('trial_usage', 0.0)
        features.email_opens = behavioral_data.get('email_opens', 0)
        features.demo_requested = behavioral_data.get('demo_requested', False)
        
        # Product interest features
        features.feature_questions = sum(1 for msg in messages if any(word in msg.get('content', '').lower() 
                                                                    for word in ['feature', 'capability', 'function']))
        features.pricing_questions = sum(1 for msg in messages if any(word in msg.get('content', '').lower() 
                                                                    for word in ['price', 'cost', 'pricing', 'plan']))
        features.integration_questions = sum(1 for msg in messages if any(word in msg.get('content', '').lower() 
                                                                        for word in ['integrate', 'api', 'connection']))
        features.competitor_mentions = sum(1 for msg in messages if any(word in msg.get('content', '').lower() 
                                                                      for word in ['salesforce', 'hubspot', 'competitor']))
        
        # Calculate engagement score
        features.engagement_score = (
            features.message_count * 0.2 +
            features.avg_message_length * 0.1 +
            features.question_count * 0.3 +
            features.urgency_indicators * 0.4
        )
        
        return features
    
    def features_to_dataframe(self, features: LeadFeatures) -> pd.DataFrame:
        """Convert LeadFeatures to pandas DataFrame."""
        feature_dict = {
            'message_count': features.message_count,
            'avg_message_length': features.avg_message_length,
            'question_count': features.question_count,
            'engagement_score': features.engagement_score,
            'budget_mentioned': features.budget_mentioned,
            'timeline_mentioned': features.timeline_mentioned,
            'pain_points_clear': features.pain_points_clear,
            'decision_maker': features.decision_maker,
            'urgency_indicators': features.urgency_indicators,
            'team_size': features.team_size or 0,
            'role_authority': features.role_authority,
            'pages_visited': features.pages_visited,
            'trial_usage': features.trial_usage,
            'email_opens': features.email_opens,
            'demo_requested': features.demo_requested,
            'feature_questions': features.feature_questions,
            'pricing_questions': features.pricing_questions,
            'integration_questions': features.integration_questions,
            'competitor_mentions': features.competitor_mentions
        }
        
        # Add categorical features
        feature_dict['company_size_category_enterprise'] = features.company_size_category == 'enterprise'
        feature_dict['company_size_category_mid_market'] = features.company_size_category == 'mid_market'
        feature_dict['company_size_category_smb'] = features.company_size_category == 'smb'
        
        return pd.DataFrame([feature_dict])
    
    def train(self, training_data: List[Dict[str, Any]]):
        """Train the model on historical CRM data."""
        if len(training_data) < predictive_config.min_samples_for_training:
            logger.warning(f"Insufficient training data. Need at least {predictive_config.min_samples_for_training} samples.")
            return
        
        # Extract features and labels
        X = []
        y_intent = []
        y_score = []
        
        for data_point in training_data:
            features = self.extract_features(data_point)
            X.append(self.features_to_dataframe(features))
            y_intent.append(data_point.get('intent', 'researching'))
            y_score.append(data_point.get('conversion_score', 0))
        
        # Combine features
        X_combined = pd.concat(X, ignore_index=True)
        
        # Encode intent labels
        y_intent_encoded = self.intent_encoder.fit_transform(y_intent)
        
        # Split data
        X_train, X_test, y_train_intent, y_test_intent, y_train_score, y_test_score = train_test_split(
            X_combined, y_intent_encoded, y_score, test_size=0.2, random_state=42
        )
        
        # Train intent classification model
        self.model.fit(X_train, y_train_intent)
        
        # Evaluate model
        y_pred_intent = self.model.predict(X_test)
        accuracy = accuracy_score(y_test_intent, y_pred_intent)
        
        logger.info(f"Model training completed. Intent classification accuracy: {accuracy:.3f}")
        
        # Save feature names
        self.feature_names = list(X_combined.columns)
        self.is_trained = True
        
        # Save model
        self._save_model()
        
        return {
            'accuracy': accuracy,
            'feature_importance': dict(zip(self.feature_names, self.model.feature_importances_))
        }
    
    def predict(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict lead score and intent."""
        if not self.is_trained:
            logger.warning("Model not trained. Using default predictions.")
            return self._default_prediction()
        
        # Extract features
        features = self.extract_features(conversation_data)
        X = self.features_to_dataframe(features)
        
        # Predict intent
        intent_encoded = self.model.predict(X)[0]
        intent = self.intent_encoder.inverse_transform([intent_encoded])[0]
        
        # Calculate score based on features and intent
        score = self._calculate_score(features, intent)
        
        # Generate signals
        signals = self._extract_signals(features)
        
        # Generate recommendation
        recommendation = self._generate_recommendation(intent, score, signals)
        
        return {
            'intent': intent,
            'score': score,
            'signals': signals,
            'recommendation': recommendation,
            'features': features
        }
    
    def _default_prediction(self) -> Dict[str, Any]:
        """Return default prediction when model is not trained."""
        return {
            'intent': 'researching',
            'score': 50,
            'signals': ['default_prediction'],
            'recommendation': 'nurture_email',
            'features': LeadFeatures()
        }
    
    def _calculate_score(self, features: LeadFeatures, intent: str) -> int:
        """Calculate lead score based on features and intent."""
        base_score = 50
        
        # Intent-based scoring
        intent_scores = {
            'buy_soon': 30,
            'considering': 15,
            'researching': 0,
            'not_interested': -20
        }
        base_score += intent_scores.get(intent, 0)
        
        # Feature-based scoring
        if features.budget_mentioned:
            base_score += 10
        if features.timeline_mentioned:
            base_score += 10
        if features.pain_points_clear:
            base_score += 15
        if features.decision_maker:
            base_score += 20
        if features.urgency_indicators > 0:
            base_score += features.urgency_indicators * 5
        
        # Engagement scoring
        base_score += min(features.engagement_score * 10, 20)
        
        # Team size scoring
        if features.team_size:
            if features.team_size > 100:
                base_score += 10
            elif features.team_size > 10:
                base_score += 5
        
        # Behavioral scoring
        base_score += min(features.pages_visited * 2, 10)
        base_score += min(features.trial_usage * 20, 20)
        base_score += min(features.email_opens, 10)
        if features.demo_requested:
            base_score += 15
        
        # Clamp score to 0-100 range
        return max(0, min(100, int(base_score)))
    
    def _extract_signals(self, features: LeadFeatures) -> List[str]:
        """Extract top signals from features."""
        signals = []
        
        if features.budget_mentioned:
            signals.append("budget mentioned")
        if features.timeline_mentioned:
            signals.append("timeline specified")
        if features.pain_points_clear:
            signals.append("pain points clear")
        if features.decision_maker:
            signals.append("decision maker identified")
        if features.urgency_indicators > 0:
            signals.append(f"{features.urgency_indicators} urgency indicators")
        if features.team_size:
            signals.append(f"team size: {features.team_size}")
        if features.demo_requested:
            signals.append("demo requested")
        if features.trial_usage > 0:
            signals.append("trial usage detected")
        
        return signals[:5]  # Return top 5 signals
    
    def _generate_recommendation(self, intent: str, score: int, signals: List[str]) -> str:
        """Generate recommended action based on intent and score."""
        if score >= 80:
            return "schedule_demo"
        elif score >= 60:
            if "budget" in ' '.join(signals).lower():
                return "send_pricing"
            else:
                return "schedule_demo"
        elif score >= 40:
            return "send_ROI_report"
        else:
            return "nurture_email"


# Global model instance
_predictive_model = None

def get_predictive_model() -> LeadScoringModel:
    """Get the global predictive model instance."""
    global _predictive_model
    if _predictive_model is None:
        _predictive_model = LeadScoringModel()
    return _predictive_model

def train_model_from_data(training_data_path: str):
    """Train the model from a CSV file with historical CRM data."""
    model = get_predictive_model()
    
    try:
        import json
        import ast
        
        # Load training data
        df = pd.read_csv(training_data_path)
        
        # Convert to training format
        training_data = []
        for _, row in df.iterrows():
            try:
                # Parse messages (list of dicts)
                messages_str = row.get('messages', '[]')
                if messages_str and messages_str != '[]':
                    # Clean up the string - replace escaped quotes and fix formatting
                    messages_str = messages_str.replace("\\'", "'").replace('\\"', '"')
                    # Remove outer quotes if present
                    if messages_str.startswith('"') and messages_str.endswith('"'):
                        messages_str = messages_str[1:-1]
                    try:
                        messages = ast.literal_eval(messages_str)
                    except:
                        # Fallback to json.loads if ast.literal_eval fails
                        import json
                        messages = json.loads(messages_str)
                else:
                    messages = []
                
                # Parse lead_info (dict)
                lead_info_str = row.get('lead_info', '{}')
                if lead_info_str and lead_info_str != '{}':
                    # Clean up the string
                    lead_info_str = lead_info_str.replace("\\'", "'").replace('\\"', '"')
                    if lead_info_str.startswith('"') and lead_info_str.endswith('"'):
                        lead_info_str = lead_info_str[1:-1]
                    try:
                        lead_info = ast.literal_eval(lead_info_str)
                    except:
                        import json
                        lead_info = json.loads(lead_info_str)
                else:
                    lead_info = {}
                
                # Parse behavioral_data (dict)
                behavioral_data_str = row.get('behavioral_data', '{}')
                if behavioral_data_str and behavioral_data_str != '{}':
                    # Clean up the string
                    behavioral_data_str = behavioral_data_str.replace("\\'", "'").replace('\\"', '"')
                    if behavioral_data_str.startswith('"') and behavioral_data_str.endswith('"'):
                        behavioral_data_str = behavioral_data_str[1:-1]
                    try:
                        behavioral_data = ast.literal_eval(behavioral_data_str)
                    except:
                        import json
                        behavioral_data = json.loads(behavioral_data_str)
                else:
                    behavioral_data = {}
                
                data_point = {
                    'messages': messages,
                    'lead_info': lead_info,
                    'behavioral_data': behavioral_data,
                    'intent': row.get('intent', 'researching'),
                    'conversion_score': row.get('conversion_score', 0)
                }
                training_data.append(data_point)
                
            except Exception as row_error:
                logger.warning(f"Error parsing row {_}: {row_error}")
                continue
        
        if not training_data:
            logger.warning("No valid training data found")
            return None
        
        # Train model
        results = model.train(training_data)
        
        logger.info(f"Model training completed with {len(training_data)} samples")
        return results
        
    except Exception as e:
        logger.error(f"Error training model: {e}")
        return None
