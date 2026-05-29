"""
LLM pipeline for conversational lead qualification with RAG and structured output.
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_community.llms import HuggingFacePipeline
from langchain.schema import HumanMessage, SystemMessage

from config.settings import model_config
from config.prompts import get_prompt, PROMPT_TEMPLATES
from models.vector_store import get_vector_store
from models.predictive_model import get_predictive_model
from utils.logging import get_logger

logger = get_logger(__name__)

@dataclass
class ConversationState:
    """State management for ongoing conversations."""
    
    conversation_id: str
    messages: List[Dict[str, Any]]
    lead_info: Dict[str, Any]
    behavioral_data: Dict[str, Any]
    collected_fields: List[str]
    current_intent: str = "researching"
    current_score: int = 50

class LLMPipeline:
    """Main LLM pipeline for lead qualification."""
    
    def __init__(self):
        """Initialize the LLM pipeline."""
        self.tokenizer = None
        self.model = None
        self.pipeline = None
        self.llm = None
        
        # Initialize components
        self.vector_store = get_vector_store()
        self.predictive_model = get_predictive_model()
        
        # Conversation states
        self.conversations: Dict[str, ConversationState] = {}
        
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the LLM model and pipeline."""
        try:
            logger.info(f"Loading LLM model: {model_config.llm_model_name}")
            
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(model_config.llm_model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_config.llm_model_name,
                torch_dtype="auto",
                device_map="auto",
                trust_remote_code=True
            )
            
            # Create pipeline
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_length=model_config.llm_max_length,
                temperature=model_config.llm_temperature,
                top_p=model_config.llm_top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Create LangChain LLM wrapper
            self.llm = HuggingFacePipeline(pipeline=self.pipeline)
            
            logger.info("LLM pipeline initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            # Fallback to a simpler approach
            self._initialize_fallback()
    
    def _initialize_fallback(self):
        """Initialize a fallback LLM for when the main model fails."""
        logger.info("Initializing fallback LLM")
        # This would be a simpler model or mock implementation
        pass
    
    def start_conversation(self, conversation_id: str) -> str:
        """Start a new conversation and return the initial greeting."""
        # Initialize conversation state
        self.conversations[conversation_id] = ConversationState(
            conversation_id=conversation_id,
            messages=[],
            lead_info={},
            behavioral_data={},
            collected_fields=[]
        )
        
        # Generate greeting
        greeting = get_prompt("greeting")
        return greeting
    
    def process_message(self, conversation_id: str, user_message: str) -> Dict[str, Any]:
        """Process a user message and return the response with structured data."""
        if conversation_id not in self.conversations:
            return self._error_response("Conversation not found")
        
        conversation = self.conversations[conversation_id]
        
        try:
            # Add user message to conversation
            conversation.messages.append({
                'role': 'user',
                'content': user_message,
                'timestamp': self._get_timestamp()
            })
            
            # Get relevant knowledge
            product_knowledge = self.vector_store.get_product_knowledge(user_message)
            case_studies = self.vector_store.get_case_studies(user_message)
            competitor_info = self.vector_store.get_competitor_info(user_message)
            
            # Generate response
            response = self._generate_response(conversation, user_message, product_knowledge, case_studies, competitor_info)
            
            # Add bot response to conversation
            conversation.messages.append({
                'role': 'assistant',
                'content': response['response'],
                'timestamp': self._get_timestamp()
            })
            
            # Update lead information
            self._update_lead_info(conversation, user_message)
            
            # Generate structured output
            structured_output = self._generate_structured_output(conversation, user_message)
            
            # Update conversation state
            conversation.current_intent = structured_output['intent']
            conversation.current_score = structured_output['score']
            
            return {
                'response': response['response'],
                'structured_output': structured_output,
                'conversation_id': conversation_id
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return self._error_response(f"Error processing message: {str(e)}")
    
    def _generate_response(self, conversation: ConversationState, user_message: str, 
                          product_knowledge: str, case_studies: str, competitor_info: str) -> Dict[str, Any]:
        """Generate a conversational response."""
        
        # Build context
        context = self._build_context(conversation, user_message, product_knowledge, case_studies, competitor_info)
        
        # Generate response using LLM
        try:
            if self.llm:
                # Use LangChain LLM
                messages = [
                    SystemMessage(content=context['system_prompt']),
                    HumanMessage(content=context['user_prompt'])
                ]
                
                response = self.llm.invoke(messages)
                bot_response = response.content
            else:
                # Fallback response
                bot_response = self._generate_fallback_response(conversation, user_message)
            
            return {'response': bot_response}
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return {'response': self._generate_fallback_response(conversation, user_message)}
    
    def _build_context(self, conversation: ConversationState, user_message: str,
                      product_knowledge: str, case_studies: str, competitor_info: str) -> Dict[str, str]:
        """Build context for LLM generation."""
        
        # System prompt
        system_prompt = get_prompt("system")
        
        # Build conversation history
        conversation_history = ""
        for msg in conversation.messages[-5:]:  # Last 5 messages
            role = "User" if msg['role'] == 'user' else "Assistant"
            conversation_history += f"{role}: {msg['content']}\n"
        
        # Build user prompt
        user_prompt = f"""
Conversation History:
{conversation_history}

Available Product Knowledge:
{product_knowledge}

Case Studies:
{case_studies}

Competitor Information:
{competitor_info}

User Message: {user_message}

Please respond naturally while gathering qualification information and providing helpful product information.
"""
        
        return {
            'system_prompt': system_prompt,
            'user_prompt': user_prompt
        }
    
    def _generate_fallback_response(self, conversation: ConversationState, user_message: str) -> str:
        """Generate a fallback response when LLM fails."""
        
        # Simple rule-based response
        user_message_lower = user_message.lower()
        
        if any(word in user_message_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm here to help you find the right solution. Could you tell me a bit about your role and what you're looking to accomplish?"
        
        elif any(word in user_message_lower for word in ['price', 'cost', 'pricing']):
            return "I'd be happy to discuss pricing options. To provide the most accurate information, could you tell me about your team size and specific needs?"
        
        elif any(word in user_message_lower for word in ['demo', 'demonstration']):
            return "Great! I'd be happy to schedule a demo. Could you share your company name and role so I can prepare a personalized demonstration?"
        
        elif any(word in user_message_lower for word in ['feature', 'capability']):
            return "Our platform offers comprehensive features. To give you the most relevant information, could you tell me about your current challenges and team size?"
        
        else:
            return "Thank you for your message. I'd love to learn more about your needs so I can provide the most relevant information. Could you tell me about your role and what you're trying to accomplish?"
    
    def _update_lead_info(self, conversation: ConversationState, user_message: str):
        """Update lead information from the conversation."""
        # Simple extraction - in production, you'd use NER or more sophisticated extraction
        user_message_lower = user_message.lower()
        
        # Extract company name (simple pattern matching)
        company_patterns = [
            r"at (\w+)",
            r"from (\w+)",
            r"work for (\w+)",
            r"company (\w+)"
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, user_message_lower)
            if match:
                conversation.lead_info['company'] = match.group(1).title()
                break
        
        # Extract role
        role_patterns = [
            r"(\w+ manager)",
            r"(\w+ director)",
            r"(\w+ lead)",
            r"(\w+ engineer)",
            r"(\w+ analyst)"
        ]
        
        for pattern in role_patterns:
            match = re.search(pattern, user_message_lower)
            if match:
                conversation.lead_info['role'] = match.group(1)
                break
        
        # Extract team size
        team_size_patterns = [
            r"(\d+) person",
            r"(\d+) people",
            r"team of (\d+)",
            r"(\d+) employees"
        ]
        
        for pattern in team_size_patterns:
            match = re.search(pattern, user_message_lower)
            if match:
                conversation.lead_info['team_size'] = int(match.group(1))
                break
    
    def _generate_structured_output(self, conversation: ConversationState, user_message: str) -> Dict[str, Any]:
        """Generate structured JSON output for the lead."""
        
        # Get predictive model output
        conversation_data = {
            'messages': conversation.messages,
            'lead_info': conversation.lead_info,
            'behavioral_data': conversation.behavioral_data
        }
        
        prediction = self.predictive_model.predict(conversation_data)
        
        # Extract lead information
        lead_info = {
            'name': conversation.lead_info.get('name'),
            'email': conversation.lead_info.get('email'),
            'company': conversation.lead_info.get('company'),
            'role': conversation.lead_info.get('role'),
            'industry': conversation.lead_info.get('industry')
        }
        
        # Generate CRM tags
        crm_tags = self._generate_crm_tags(lead_info, prediction)
        
        # Generate explanation
        explanation = self._generate_explanation(prediction)
        
        return {
            'lead': lead_info,
            'intent': prediction['intent'],
            'score': prediction['score'],
            'top_signals': prediction['signals'],
            'recommended_action': prediction['recommendation'],
            'explain': explanation,
            'crm_tags': crm_tags
        }
    
    def _generate_crm_tags(self, lead_info: Dict[str, Any], prediction: Dict[str, Any]) -> List[str]:
        """Generate CRM tags for the lead."""
        tags = []
        
        # Company size tags
        team_size = lead_info.get('team_size')
        if team_size:
            if team_size > 1000:
                tags.append('enterprise')
            elif team_size > 100:
                tags.append('mid_market')
            else:
                tags.append('smb')
        
        # Priority tags
        score = prediction['score']
        if score >= 80:
            tags.append('high_priority')
        elif score >= 60:
            tags.append('medium_priority')
        else:
            tags.append('low_priority')
        
        # Intent-based tags
        intent = prediction['intent']
        if intent == 'buy_soon':
            tags.append('hot_lead')
        elif intent == 'researching':
            tags.append('nurture')
        
        # Tool migration tags
        signals_text = ' '.join(prediction['signals']).lower()
        if 'salesforce' in signals_text:
            tags.append('salesforce_migration')
        if 'hubspot' in signals_text:
            tags.append('hubspot_migration')
        
        return tags[:5]  # Return top 5 tags
    
    def _generate_explanation(self, prediction: Dict[str, Any]) -> str:
        """Generate a one-sentence explanation for the recommendation."""
        intent = prediction['intent']
        score = prediction['score']
        recommendation = prediction['recommendation']
        
        if recommendation == 'schedule_demo':
            return f"High-scoring lead ({score}) with {intent} intent - ready for product demonstration."
        elif recommendation == 'send_pricing':
            return f"Lead showing {intent} intent with budget interest - pricing information requested."
        elif recommendation == 'send_ROI_report':
            return f"Lead in {intent} phase - ROI report will help demonstrate business value."
        else:
            return f"Lead in {intent} phase - nurture email to maintain engagement and provide value."
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _error_response(self, error_message: str) -> Dict[str, Any]:
        """Generate an error response."""
        return {
            'response': f"I apologize, but I encountered an error: {error_message}. Please try again or contact support.",
            'structured_output': {
                'lead': {},
                'intent': 'researching',
                'score': 50,
                'top_signals': ['error_occurred'],
                'recommended_action': 'nurture_email',
                'explain': 'Error occurred during processing',
                'crm_tags': ['error']
            },
            'conversation_id': None
        }
    
    def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """Get a summary of the conversation."""
        if conversation_id not in self.conversations:
            return {}
        
        conversation = self.conversations[conversation_id]
        
        return {
            'conversation_id': conversation_id,
            'message_count': len(conversation.messages),
            'lead_info': conversation.lead_info,
            'current_intent': conversation.current_intent,
            'current_score': conversation.current_score,
            'collected_fields': conversation.collected_fields
        }
    
    def end_conversation(self, conversation_id: str) -> str:
        """End a conversation and return a summary."""
        if conversation_id not in self.conversations:
            return "Conversation not found."
        
        conversation = self.conversations[conversation_id]
        
        # Generate closing message
        closing_prompt = get_prompt("closing", 
                                  recommendation=conversation.current_intent,
                                  explanation=f"Lead score: {conversation.current_score}",
                                  recommended_action=conversation.current_intent)
        
        # Remove conversation from memory
        del self.conversations[conversation_id]
        
        return closing_prompt


# Global LLM pipeline instance
_llm_pipeline = None

def get_llm_pipeline() -> LLMPipeline:
    """Get the global LLM pipeline instance."""
    global _llm_pipeline
    if _llm_pipeline is None:
        _llm_pipeline = LLMPipeline()
    return _llm_pipeline
