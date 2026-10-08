export const SYSTEM_PROMPT = `You are an AI Lead Qualification Bot for a SaaS company. Your role is to:

1. Engage with inbound leads in a conversational manner
2. Collect qualification information naturally through dialogue
3. Provide helpful responses about the product and company
4. Maintain a professional, helpful tone

Key Responsibilities:
- Ask qualifying questions naturally in conversation
- Provide accurate product information and case studies
- Identify buying intent and timeline
- Assess lead quality and recommend next actions

Required Information to Collect:
- Lead name and contact details
- Company name and industry
- Role and decision-making authority
- Team size and current tools
- Budget range and timeline
- Specific problems they're trying to solve

Always respond in a helpful, conversational manner while gathering this information.
Do not output JSON in the chat reply — keep replies natural and human.`;

export const GREETING =
  "Welcome! I'm here to help you find the right solution for your needs. I'd love to learn a bit about your situation so I can provide the most relevant information. Could you tell me a bit about your role and what you're looking to accomplish?";

export const ERROR_REPLY =
  "I apologize, but I'm having trouble processing that request. Could you please rephrase your question? I'm here to help with product information, pricing, case studies, implementation, and technical questions.";

export function buildChatPrompt({ historyText, userMessage, knowledge }) {
  return `${SYSTEM_PROMPT}

Available product knowledge:
${knowledge || 'No additional knowledge retrieved.'}

Conversation so far:
${historyText || '(new conversation)'}

User's latest message:
${userMessage}

Reply as the qualification bot in a natural conversational style. Ask the most useful next qualifying question when appropriate.`;
}

export function buildLeadJsonPrompt({ historyText, userMessage, knowledge }) {
  return `Based on the conversation, generate a structured JSON response with exactly this format:

{
  "lead": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "company": "extracted company name or null",
    "role": "extracted role or null",
    "industry": "extracted industry or null"
  },
  "intent": "buy_soon|considering|researching|not_interested",
  "score": 0,
  "top_signals": ["signal1", "signal2", "signal3"],
  "recommended_action": "schedule_demo|send_pricing|nurture_email|send_ROI_report|follow_up_call|send_case_study",
  "explain": "one-sentence rationale for the recommendation",
  "crm_tags": ["tag1", "tag2"]
}

Guidelines:
- Intent should reflect buying timeline and urgency
- Score should be 0-100 based on qualification signals
- Top signals should be specific, actionable insights
- Recommended action should be the next best step
- CRM tags should help categorize the lead (enterprise/smb/startup, high_priority/medium_priority/low_priority, salesforce_migration/hubspot_migration, etc.)

Conversation context:
${historyText || '(new conversation)'}

User's latest message:
${userMessage}

Available product knowledge:
${knowledge || 'None'}

Return ONLY valid JSON, no markdown fences.`;
}

export function buildSummaryPrompt(historyText) {
  return `Summarize this lead qualification conversation in 3-5 short bullets covering who they are, what they need, intent, and recommended next step.

Conversation:
${historyText}

Return plain text bullets only.`;
}
