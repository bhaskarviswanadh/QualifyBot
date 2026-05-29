import requests
from typing import Dict, Any
from datetime import datetime
from config.settings import crm_config
from utils.logging import get_logger
from .base import CRMIntegration

logger = get_logger(__name__)

class SalesforceIntegration(CRMIntegration):
    """Handles Salesforce API calls for lead management."""
    
    def __init__(self):
        super().__init__()
        self.api_key = crm_config.salesforce_api_key
        self.base_url = crm_config.salesforce_base_url
        
        if not self.api_key and not self.mock_mode:
            logger.warning("No Salesforce credentials, using mock mode")
            self.mock_mode = True
    
    def create_lead(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new Lead object in Salesforce."""
        if self.mock_mode:
            return self._mock_create(lead_info)
        
        try:
            endpoint = f"{self.base_url}/services/data/v58.0/sobjects/Lead"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Salesforce requires LastName, so we split or default
            name_parts = (lead_info.get("name") or "").split(maxsplit=1)
            first = name_parts[0] if name_parts else ""
            last = name_parts[1] if len(name_parts) > 1 else "Unknown"
            
            payload = {
                "FirstName": first,
                "LastName": last,
                "Email": lead_info.get("email"),
                "Company": lead_info.get("company"),
                "Title": lead_info.get("role"),
                "Industry": lead_info.get("industry"),
                "LeadSource": "AI Bot",
                "Status": "New"
            }
            
            resp = requests.post(endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            
            sf_id = resp.json().get('id')
            logger.info(f"Created Salesforce lead: {sf_id}")
            
            return {
                "success": True,
                "lead_id": sf_id,
                "salesforce_id": sf_id,
                "message": "Lead created"
            }
            
        except Exception as e:
            logger.error(f"Salesforce create error: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Lead creation failed"
            }
    
    def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing Salesforce lead."""
        if self.mock_mode:
            return self._mock_update(lead_id, updates)
        
        try:
            endpoint = f"{self.base_url}/services/data/v58.0/sobjects/Lead/{lead_id}"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {}
            if updates.get("intent"):
                payload["Status"] = updates["intent"].upper()
            if updates.get("score"):
                # Custom field - adjust to match your SF setup
                payload["Lead_Score__c"] = updates["score"]
            if updates.get("company"):
                payload["Company"] = updates["company"]
            
            resp = requests.patch(endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            
            logger.info(f"Updated Salesforce lead: {lead_id}")
            
            return {
                "success": True,
                "lead_id": lead_id,
                "message": "Lead updated"
            }
            
        except Exception as e:
            logger.error(f"Salesforce update error: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Update failed"
            }
    
    def add_note(self, lead_id: str, note_text: str) -> Dict[str, Any]:
        """Attaches a note to a Salesforce lead."""
        if self.mock_mode:
            return self._mock_note(lead_id, note_text)
        
        try:
            endpoint = f"{self.base_url}/services/data/v58.0/sobjects/Note"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "Title": "AI Bot Note",
                "Body": note_text,
                "ParentId": lead_id
            }
            
            resp = requests.post(endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            
            note_id = resp.json().get("id")
            logger.info(f"Added note to Salesforce lead {lead_id}")
            
            return {
                "success": True,
                "note_id": note_id,
                "message": "Note created"
            }
            
        except Exception as e:
            logger.error(f"Salesforce note error: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Note creation failed"
            }
    
    def _mock_create(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Mock lead creation for dev/test."""
        fake_id = f"mock_sf_{datetime.now().timestamp()}"
        logger.info(f"Mock: Created SF lead {fake_id}")
        
        return {
            "success": True,
            "lead_id": fake_id,
            "salesforce_id": fake_id,
            "message": "Mock lead created"
        }
    
    def _mock_update(self, lead_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Mock update for dev/test."""
        logger.info(f"Mock: Updated SF lead {lead_id}")
        
        return {
            "success": True,
            "lead_id": lead_id,
            "message": "Mock update done"
        }
    
    def _mock_note(self, lead_id: str, note_text: str) -> Dict[str, Any]:
        """Mock note for dev/test."""
        fake_note_id = f"mock_note_{datetime.now().timestamp()}"
        logger.info(f"Mock: Added note to SF lead {lead_id}")
        
        return {
            "success": True,
            "note_id": fake_note_id,
            "message": "Mock note added"
        }
