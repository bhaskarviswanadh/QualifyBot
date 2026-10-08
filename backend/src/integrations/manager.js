import { HubSpotIntegration } from './hubspot.js';
import { SalesforceIntegration } from './salesforce.js';

class CRMClient {
  constructor() {
    this.hubspot = new HubSpotIntegration();
    this.salesforce = new SalesforceIntegration();
  }

  async syncLeads(leadInfo) {
    const [hubspot, salesforce] = await Promise.all([
      this.hubspot.createLead(leadInfo),
      this.salesforce.createLead(leadInfo),
    ]);
    return { hubspot, salesforce };
  }
}

let client;

export function getCrmClient() {
  if (!client) client = new CRMClient();
  return client;
}
