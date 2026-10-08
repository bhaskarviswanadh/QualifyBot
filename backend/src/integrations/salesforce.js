import axios from 'axios';
import { settings } from '../config/settings.js';

export class SalesforceIntegration {
  constructor() {
    this.apiKey = settings.crm.salesforceApiKey;
    this.baseUrl = settings.crm.salesforceBaseUrl;
    this.mockMode = settings.crm.mockMode || !this.apiKey;
  }

  async createLead(leadInfo) {
    if (this.mockMode) {
      const leadId = `mock_sf_${Date.now()}`;
      return {
        success: true,
        lead_id: leadId,
        salesforce_id: leadId,
        message: 'Mock Salesforce lead created',
      };
    }

    try {
      const nameParts = String(leadInfo.name || '').split(/\s+/);
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || 'Unknown';

      const { data } = await axios.post(
        `${this.baseUrl}/services/data/v58.0/sobjects/Lead`,
        {
          FirstName: first,
          LastName: last,
          Email: leadInfo.email || undefined,
          Company: leadInfo.company || 'Unknown',
          Title: leadInfo.role || undefined,
          Industry: leadInfo.industry || undefined,
          LeadSource: 'AI Bot',
          Status: 'New',
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
        salesforce_id: data.id,
        message: 'Lead created',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: 'Failed to create Salesforce lead',
      };
    }
  }
}
