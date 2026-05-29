from typing import Dict, Any
from .hubspot import HubSpotIntegration
from .salesforce import SalesforceIntegration

class CRMClient:
    """
    Handles syncing leads to multiple CRM platforms.
    Think of this as the traffic cop for all CRM operations.
    """
    
    def __init__(self):
        self.hubspot = HubSpotIntegration()
        self.salesforce = SalesforceIntegration()
    
    def sync_leads(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pushes lead data to all active CRMs.
        Returns a dict with results from each platform.
        """
        outcomes = {}
        
        # Try HubSpot if configured
        if self.hubspot.api_key or self.hubspot.mock_mode:
            outcomes["hubspot"] = self.hubspot.create_lead(lead_info)
        
        # Try Salesforce if configured
        if self.salesforce.api_key or self.salesforce.mock_mode:
            outcomes["salesforce"] = self.salesforce.create_lead(lead_info)
        
        return outcomes
    
    def update_lead_everywhere(self, lead_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Updates an existing lead across all CRMs."""
        outcomes = {}
        
        if self.hubspot.api_key or self.hubspot.mock_mode:
            outcomes["hubspot"] = self.hubspot.update_lead(lead_id, updates)
        
        if self.salesforce.api_key or self.salesforce.mock_mode:
            outcomes["salesforce"] = self.salesforce.update_lead(lead_id, updates)
        
        return outcomes
    
    def add_notes_everywhere(self, lead_id: str, note_text: str) -> Dict[str, Any]:
        """Adds a note to the lead in all CRMs."""
        outcomes = {}
        
        if self.hubspot.api_key or self.hubspot.mock_mode:
            outcomes["hubspot"] = self.hubspot.add_note(lead_id, note_text)
        
        if self.salesforce.api_key or self.salesforce.mock_mode:
            outcomes["salesforce"] = self.salesforce.add_note(lead_id, note_text)
        
        return outcomes

# Singleton pattern - one client for the whole app
_client_instance = None

def get_crm_client() -> CRMClient:
    """Gets the shared CRM client instance."""
    global _client_instance
    if _client_instance is None:
        _client_instance = CRMClient()
    return _client_instance
