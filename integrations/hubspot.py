import requests
from typing import Dict, Any
from datetime import datetime
from config.settings import crm_config
from utils.logging import get_logger
from .base import CRMIntegration

logger = get_logger(__name__)

class HubSpotIntegration(CRMIntegration):
    """Talks to HubSpot's API to manage contacts."""
    
    def __init__(self):
        super().__init__()
        self.api_key = crm_config.hubspot_api_key
        self.base_url = crm_config.hubspot_base_url
        
        # Auto-fallback to mock if no key
        if not self.api_key and not self.mock_mode:
            logger.warning("No HubSpot key found, running in mock mode")
            self.mock_mode = True
    
    def create_lead(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new contact in HubSpot."""
        if self.mock_mode:
            return self._mock_create(lead_info)
        
        try:
            endpoint = f"{self.base_url}/crm/v3/objects/contacts"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # HubSpot wants firstname/lastname split
            name_parts = (lead_info.get("name") or "").split(maxsplit=1)
            first = name_parts[0] if name_parts else ""
            last = name_parts[1] if len(name_parts) > 1 else ""
            
            payload = {
                "properties": {
                    "email": lead_info.get("email"),
                    "firstname": first,
                    "lastname": last,
                    "company": lead_info.get("company"),
                    "jobtitle": lead_info.get("role"),
                    "industry": lead_info.get("industry"),
                    "lifecyclestage": "lead",
                    "lead_status": "NEW"
                }
            }
            
            resp = requests.post(endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            
            contact_id = resp.json().get('id')
            logger.info(f"Created HubSpot contact: {contact_id}")
            
            return {
                "success": True,
                "lead_id": contact_id,
                "hubspot_id": contact_id,
                "message": "Contact created"
            }
            
        except Exception as e:
            logger.error(f"HubSpot create failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create contact"
            }
    
    def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing HubSpot contact."""
        if self.mock_mode:
            return self._mock_update(lead_id, updates)
        
        try:
            endpoint = f"{self.base_url}/crm/v3/objects/contacts/{lead_id}"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            props = {}
            if updates.get("intent"):
                props["lead_status"] = updates["intent"].upper()
            if updates.get("score"):
                props["hs_lead_score"] = updates["score"]
            if updates.get("company"):
                props["company"] = updates["company"]
            
            resp = requests.patch(endpoint, headers=headers, json={"properties": props})
            resp.raise_for_status()
            
            logger.info(f"Updated HubSpot contact: {lead_id}")
            
            return {
                "success": True,
                "lead_id": lead_id,
                "message": "Contact updated"
            }
            
        except Exception as e:
            logger.error(f"HubSpot update failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Update failed"
            }
    
    def add_note(self, lead_id: str, note_text: str) -> Dict[str, Any]:
        """Adds a note to a HubSpot contact."""
        if self.mock_mode:
            return self._mock_note(lead_id, note_text)
        
        try:
            endpoint = f"{self.base_url}/crm/v3/objects/notes"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "properties": {
                    "hs_note_body": note_text,
                    "hs_timestamp": datetime.now().isoformat()
                },
                "associations": [{
                    "to": {"id": lead_id},
                    "types": [{
                        "associationCategory": "HUBSPOT_DEFINED",
                        "associationTypeId": 1
                    }]
                }]
            }
            
            resp = requests.post(endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            
            note_id = resp.json().get("id")
            logger.info(f"Added note to HubSpot contact {lead_id}")
            
            return {
                "success": True,
                "note_id": note_id,
                "message": "Note added"
            }
            
        except Exception as e:
            logger.error(f"HubSpot note failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Note creation failed"
            }
    
    def _mock_create(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Fake contact creation for testing."""
        fake_id = f"mock_hs_{datetime.now().timestamp()}"
        logger.info(f"Mock: Created HubSpot contact {fake_id}")
        
        return {
            "success": True,
            "lead_id": fake_id,
            "hubspot_id": fake_id,
            "message": "Mock contact created"
        }
    
    def _mock_update(self, lead_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Fake update for testing."""
        logger.info(f"Mock: Updated HubSpot contact {lead_id}")
        
        return {
            "success": True,
            "lead_id": lead_id,
            "message": "Mock update complete"
        }
    
    def _mock_note(self, lead_id: str, note_text: str) -> Dict[str, Any]:
        """Fake note for testing."""
        fake_note_id = f"mock_note_{datetime.now().timestamp()}"
        logger.info(f"Mock: Added note to {lead_id}")
        
        return {
            "success": True,
            "note_id": fake_note_id,
            "message": "Mock note added"
        }
