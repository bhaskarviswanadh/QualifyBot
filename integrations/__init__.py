from .manager import get_crm_client, CRMClient
from .hubspot import HubSpotIntegration
from .salesforce import SalesforceIntegration
from .base import CRMIntegration

__all__ = [
    'get_crm_client',
    'CRMClient',
    'HubSpotIntegration',
    'SalesforceIntegration',
    'CRMIntegration'
]
