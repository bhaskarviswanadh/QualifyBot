import axios from 'axios';
import { settings } from '../config/settings.js';

export class HubSpotIntegration {
  constructor() {
    this.apiKey = settings.crm.hubspotApiKey;
    this.baseUrl = settings.crm.hubspotBaseUrl;
    this.mockMode = settings.crm.mockMode || !this.apiKey;
  }

  async createLead(leadInfo) {
    if (this.mockMode) {
      const leadId = `mock_hs_${Date.now()}`;
      return {
        success: true,
        lead_id: leadId,
        hubspot_id: leadId,
        message: 'Mock HubSpot contact created',
      };
    }

    try {
      const nameParts = String(leadInfo.name || '').split(/\s+/);
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      const { data } = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        {
          properties: {
            email: leadInfo.email || undefined,
            firstname: first,
            lastname: last,
            company: leadInfo.company || undefined,
            jobtitle: leadInfo.role || undefined,
            industry: leadInfo.industry || undefined,
            lifecyclestage: 'lead',
            lead_status: 'NEW',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        lead_id: data.id,
        hubspot_id: data.id,
        message: 'Contact created',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: 'Failed to create HubSpot contact',
      };
    }
  }
}
