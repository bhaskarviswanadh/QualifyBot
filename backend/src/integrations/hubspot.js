import axios from 'axios';
import { settings } from '../config/settings.js';

export class HubSpotIntegration {
  constructor() {
    this.apiKey = settings.crm.hubspotApiKey;
    this.baseUrl = settings.crm.hubspotBaseUrl;
    this.mockMode = settings.crm.mockMode || !this.apiKey;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  buildProperties(leadInfo) {
    const nameParts = String(leadInfo.name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const first = nameParts[0] || 'Unknown';
    const last = nameParts.slice(1).join(' ') || 'Lead';

    const properties = {
      firstname: first,
      lastname: last,
      lifecyclestage: 'lead',
    };

    if (leadInfo.email) properties.email = String(leadInfo.email).trim();
    if (leadInfo.company) properties.company = String(leadInfo.company).trim();
    if (leadInfo.role) properties.jobtitle = String(leadInfo.role).trim();
    // industry is optional and not always available on contacts in all portals

    return properties;
  }

  hubspotError(err) {
    const data = err.response?.data;
    const detail =
      data?.message ||
      data?.errors?.[0]?.message ||
      err.message ||
      'Unknown HubSpot error';
    return detail;
  }

  async createLead(leadInfo) {
    if (this.mockMode) {
      return {
        success: false,
        lead_id: null,
        hubspot_id: null,
        message: 'Not integrated',
      };
    }

    const properties = this.buildProperties(leadInfo);

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        { properties },
        { headers: this.headers() }
      );

      return {
        success: true,
        lead_id: data.id,
        hubspot_id: data.id,
        message: 'Contact created in HubSpot',
      };
    } catch (err) {
      // Duplicate email → update existing contact instead
      const existingId = err.response?.data?.message?.match(/Existing ID:\s*(\d+)/)?.[1]
        || err.response?.data?.errors?.find((e) => e.context?.id)?.context?.id?.[0];

      if (err.response?.status === 409 && properties.email) {
        try {
          const updated = await this.updateByEmail(properties);
          return updated;
        } catch (updateErr) {
          return {
            success: false,
            error: this.hubspotError(updateErr),
            message: `Failed to update HubSpot contact: ${this.hubspotError(updateErr)}`,
          };
        }
      }

      if (existingId) {
        try {
          const { data } = await axios.patch(
            `${this.baseUrl}/crm/v3/objects/contacts/${existingId}`,
            { properties },
            { headers: this.headers() }
          );
          return {
            success: true,
            lead_id: data.id,
            hubspot_id: data.id,
            message: 'Existing HubSpot contact updated',
          };
        } catch (updateErr) {
          return {
            success: false,
            error: this.hubspotError(updateErr),
            message: `Failed to update HubSpot contact: ${this.hubspotError(updateErr)}`,
          };
        }
      }

      console.error('[hubspot] create failed:', this.hubspotError(err));
      return {
        success: false,
        error: this.hubspotError(err),
        message: `Failed to create HubSpot contact: ${this.hubspotError(err)}`,
      };
    }
  }

  async updateByEmail(properties) {
    const email = properties.email;
    const { data: search } = await axios.post(
      `${this.baseUrl}/crm/v3/objects/contacts/search`,
      {
        filterGroups: [
          {
            filters: [
              { propertyName: 'email', operator: 'EQ', value: email },
            ],
          },
        ],
        limit: 1,
      },
      { headers: this.headers() }
    );

    const id = search.results?.[0]?.id;
    if (!id) throw new Error('Contact with this email not found for update');

    const { data } = await axios.patch(
      `${this.baseUrl}/crm/v3/objects/contacts/${id}`,
      { properties },
      { headers: this.headers() }
    );

    return {
      success: true,
      lead_id: data.id,
      hubspot_id: data.id,
      message: 'Existing HubSpot contact updated',
    };
  }
}
