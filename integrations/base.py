from typing import Dict, Any
from config.settings import crm_config

class CRMIntegration:
    """Base class for CRM integrations."""
    
    def __init__(self):
        self.api_key = None
        self.base_url = None
        self.mock_mode = crm_config.mock_mode
    
    def create_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new lead in the CRM."""
        raise NotImplementedError
    
    def update_lead(self, lead_id: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing lead in the CRM."""
        raise NotImplementedError
    
    def add_note(self, lead_id: str, note: str) -> Dict[str, Any]:
        """Add a note to a lead."""
        raise NotImplementedError
    
    def log_activity(self, lead_id: str, activity_type: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Log an activity for a lead."""
        raise NotImplementedError
