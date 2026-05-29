import os
import json
import uuid
from typing import Dict, List, Any

# Local stuff
from config.settings import app_config, validate_config
from models.llm_pipeline import get_llm_pipeline
from models.vector_store import initialize_vector_store_from_files
from models.predictive_model import train_model_from_data
from integrations.manager import get_crm_client
from utils.logging import get_logger

logger = get_logger(__name__)

class LeadBot:
    """
    Core bot logic for handling lead conversations and qualification.
    """
    
    def __init__(self):
        self.llm = get_llm_pipeline()
        self.crm = get_crm_client()
        # In-memory store for active chats. 
        # TODO: Move to Redis for production.
        self.active_chats = {}
        
        self._setup()
    
    def _setup(self):
        """Boot up the necessary components."""
        try:
            if not validate_config():
                logger.error("Config check failed, check your .env")
                return
            
            # Load up our knowledge base
            initialize_vector_store_from_files(app_config.data_dir)
            
            # If we have ground truth data, train the scorer
            training_path = os.path.join(app_config.data_dir, "training_data", "crm_data.csv")
            if os.path.exists(training_path):
                logger.info("Retraining model on startup...")
                train_model_from_data(training_path)
            
            logger.info("LeadBot ready to roll")
            
        except Exception as e:
            logger.error(f"Failed to startup: {e}")
    
    def start_chat(self) -> tuple:
        """Kicks off a new session."""
        chat_id = str(uuid.uuid4())
        
        # Get the opening line from the LLM
        greeting = self.llm.start_conversation(chat_id)
        
        self.active_chats[chat_id] = {
            'history': [],
            'lead_data': None
        }
        return greeting, chat_id
    
    def chat(self, msg: str, chat_id: str, history: List[List[str]]) -> tuple:
        """
        Main chat handler.
        Takes the user message, runs it through the pipeline, updates state.
        """
        # If the frontend sends a bad ID, just restart
        if not chat_id or chat_id == "None":
            greeting, chat_id = self.start_chat()
            history = [[greeting, None]]
        
        try:
            # Getting response and extracted data
            # This is where the magic happens
            result = self.llm.process_message(chat_id, msg)
            
            # Save state
            if chat_id in self.active_chats:
                self.active_chats[chat_id]['history'].append({
                    'user': msg,
                    'bot': result['response']
                })
                self.active_chats[chat_id]['lead_data'] = result['structured_output']
            
            # Update UI history
            history.append([msg, result['response']])
            
            # Format the sidebar data
            sidebar_content = self._format_sidebar(result['structured_output'])
            
            return history, chat_id, sidebar_content
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            err_msg = "My brain just glitchd. Can you say that again?"
            history.append([msg, err_msg])
            return history, chat_id, "System Error"
    
    def _format_sidebar(self, data: Dict[str, Any]) -> str:
        """Makes the extracted data look pretty for the sidebar."""
        if not data:
            return "No data collected yet."
        
        try:
            # Pretty print JSON for the nerdy folks
            # json_dump = json.dumps(data, indent=2)
            
            lead = data.get('lead', {})
            intent = data.get('intent', 'unknown')
            score = data.get('score', 0)
            
            # Quick summary view
            return f"""
## 👤 Lead Profile
**Name:** {lead.get('name', '-')}
**Role:** {lead.get('role', '-')}
**Company:** {lead.get('company', '-')}

## 🎯 Qualification
**Intent:** `{intent}`
**Score:** **{score}/100**
**Next Step:** {data.get('recommended_action', '-')}

## 🔍 Signals
{chr(10).join([f"• {s}" for s in data.get('top_signals', [])])}

## 🏷️ Tags
{', '.join([f"`{t}`" for t in data.get('crm_tags', [])])}

---
*Analysis based on conversation context*
"""
            
        except Exception as e:
            logger.error(f"Sidebar formatting failed: {e}")
            return "Error displaying data."
    
    def sync_to_crm(self, chat_id: str) -> str:
        """Pushes the lead data to connected CRMs."""
        if not chat_id or chat_id not in self.active_chats:
            return "No active session to sync."
        
        try:
            data = self.active_chats[chat_id]['lead_data']
            if not data:
                return "Nothing to sync yet."
            
            # Flatten it for the CRM
            lead_payload = {
                'name': data['lead'].get('name'),
                'email': data['lead'].get('email'),
                'company': data['lead'].get('company'),
                'role': data['lead'].get('role'),
                'industry': data['lead'].get('industry'),
                'intent': data['intent'],
                'score': data['score'],
                'tags': data['crm_tags']
            }
            
            # Blast it to all configured CRMs
            results = self.crm.sync_leads(lead_payload)
            
            # Build a status report
            report = ["### CRM Sync Status"]
            for crm, res in results.items():
                icon = "✅" if res.get('success') else "❌"
                msg = res.get('message', 'Unknown status')
                report.append(f"{icon} **{crm.upper()}**: {msg}")
                if res.get('success'):
                    report.append(f"   ID: `{res.get('lead_id')}`")
            
            return "\n\n".join(report)
            
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return f"Sync failed: {str(e)}"
    
    def get_summary(self, chat_id: str) -> str:
        """Debug helper to see what the bot 'knows'."""
        if not chat_id or chat_id not in self.active_chats:
            return "No active session."
        
        summary = self.llm.get_conversation_summary(chat_id)
        if not summary:
            return "No summary available."
            
        # Just dump the raw summary for now
        return f"""
### Internal State Summary
**ID:** `{summary.get('conversation_id')}`
**Msgs:** {summary.get('message_count')}
**Fields Found:** {', '.join(summary.get('collected_fields', []))}
"""
