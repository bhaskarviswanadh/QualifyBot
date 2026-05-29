"""
Prompt templates for the AI Lead Qualification Bot.
"""

from typing import Dict, List, Any

# System prompt for the lead qualification bot
SYSTEM_PROMPT = """You are an AI Lead Qualification Bot for a SaaS company. Your role is to:

1. Engage with inbound leads in a conversational manner
2. Collect qualification information naturally through dialogue
3. Provide helpful responses about the product and company
4. Output structured JSON with lead data and recommendations

Key Responsibilities:
- Ask qualifying questions naturally in conversation
- Provide accurate product information and case studies
- Identify buying intent and timeline
- Assess lead quality and recommend next actions
- Maintain a professional, helpful tone

Required Information to Collect:
- Lead name and contact details
- Company name and industry
- Role and decision-making authority
- Team size and current tools
- Budget range and timeline
- Specific problems they're trying to solve

Always respond in a helpful, conversational manner while gathering this information."""

# Prompt for generating structured JSON output
JSON_OUTPUT_PROMPT = """Based on the conversation, generate a structured JSON response with the following format:

{
  "lead": {
    "name": "extracted name or null",
    "email": "extracted email or null", 
    "company": "extracted company name or null",
    "role": "extracted role or null",
    "industry": "extracted industry or null"
  },
  "intent": "buy_soon|considering|researching|not_interested",
  "score": 0-100,
  "top_signals": ["signal1", "signal2", "signal3"],
  "recommended_action": "schedule_demo|send_pricing|nurture_email|send_ROI_report",
  "explain": "one-sentence rationale for the recommendation",
  "crm_tags": ["tag1", "tag2"]
}

Guidelines:
- Intent should reflect their buying timeline and urgency
- Score should be 0-100 based on qualification signals
- Top signals should be specific, actionable insights
- Recommended action should be the next best step
- CRM tags should help categorize the lead

Conversation context:
{conversation_history}

User's latest message:
{user_message}

Available product knowledge:
{product_knowledge}

Generate the JSON response:"""

# Prompt for asking qualifying questions
QUALIFICATION_PROMPT = """Based on the conversation so far, determine what qualifying information is still needed and ask the most relevant question next.

Information already collected:
{collected_info}

Missing required information:
{missing_info}

Conversation history:
{conversation_history}

Ask a natural, conversational question to gather the most important missing information. Be helpful and provide context when appropriate."""

# Prompt for product knowledge responses
PRODUCT_KNOWLEDGE_PROMPT = """You have access to the following product information and case studies. Use this to provide accurate, helpful responses to the user's questions.

Product Information:
{product_info}

Case Studies:
{case_studies}

Competitor Information:
{competitor_info}

User Question: {user_question}

Provide a helpful, accurate response using the available information. Be conversational and address their specific needs."""

# Prompt for intent classification
INTENT_CLASSIFICATION_PROMPT = """Analyze the conversation and classify the user's buying intent.

Conversation:
{conversation}

Classify as one of:
- buy_soon: Ready to purchase within 30 days, has budget, clear pain points
- considering: Evaluating options, 1-3 month timeline, gathering information
- researching: Early stage, 3+ month timeline, just learning about solutions
- not_interested: No clear buying intent, just browsing, or not a good fit

Intent:"""

# Prompt for scoring signals
SCORING_SIGNALS_PROMPT = """Extract the most important qualification signals from this conversation.

Conversation:
{conversation}

Extract 3-5 key signals that indicate lead quality, such as:
- Budget mentioned
- Timeline specified
- Decision maker identified
- Pain points clear
- Team size mentioned
- Current tools mentioned
- Authority level
- Urgency indicators

Format as a list of specific, actionable insights."""

# Prompt for recommendation generation
RECOMMENDATION_PROMPT = """Based on the lead's intent and signals, recommend the best next action.

Lead Intent: {intent}
Lead Score: {score}
Top Signals: {signals}

Available actions:
- schedule_demo: For high-intent leads ready to see the product
- send_pricing: For leads asking about costs and pricing
- nurture_email: For leads in research phase
- send_ROI_report: For leads focused on business value
- follow_up_call: For leads needing personal touch
- send_case_study: For leads wanting social proof

Recommend the most appropriate action and provide a one-sentence explanation."""

# Prompt for CRM tagging
CRM_TAGGING_PROMPT = """Generate appropriate CRM tags for this lead based on the conversation.

Lead Information:
{lead_info}

Intent: {intent}
Score: {score}
Signals: {signals}

Available tags:
- enterprise/smb/startup (company size)
- high_priority/medium_priority/low_priority (score-based)
- salesforce_migration/hubspot_migration (current tools)
- new_customer/existing_customer (relationship)
- industry-specific tags

Select 3-5 most relevant tags:"""

# Conversation flow prompts
GREETING_PROMPT = """Welcome! I'm here to help you find the right solution for your needs. 

I'd love to learn a bit about your situation so I can provide the most relevant information. 

Could you tell me a bit about your role and what you're looking to accomplish?"""

FOLLOW_UP_PROMPT = """Thanks for sharing that information. To better understand how we can help, could you tell me:

{next_question}

This will help me provide more targeted recommendations and resources."""

CLOSING_PROMPT = """Based on our conversation, here's what I recommend as your next step:

{recommendation}

{explanation}

Would you like me to help you with anything else, or would you like to proceed with {recommended_action}?"""

# Error handling prompts
ERROR_PROMPT = """I apologize, but I'm having trouble processing that request. Could you please rephrase your question or let me know what specific information you're looking for?

I'm here to help with:
- Product information and features
- Pricing and plans
- Case studies and customer success stories
- Implementation and onboarding
- Technical questions

What would you like to know more about?"""

# Prompt templates dictionary
PROMPT_TEMPLATES = {
    "system": SYSTEM_PROMPT,
    "json_output": JSON_OUTPUT_PROMPT,
    "qualification": QUALIFICATION_PROMPT,
    "product_knowledge": PRODUCT_KNOWLEDGE_PROMPT,
    "intent_classification": INTENT_CLASSIFICATION_PROMPT,
    "scoring_signals": SCORING_SIGNALS_PROMPT,
    "recommendation": RECOMMENDATION_PROMPT,
    "crm_tagging": CRM_TAGGING_PROMPT,
    "greeting": GREETING_PROMPT,
    "follow_up": FOLLOW_UP_PROMPT,
    "closing": CLOSING_PROMPT,
    "error": ERROR_PROMPT
}

def get_prompt(template_name: str, **kwargs) -> str:
    """Get a formatted prompt template."""
    if template_name not in PROMPT_TEMPLATES:
        raise ValueError(f"Unknown prompt template: {template_name}")
    
    template = PROMPT_TEMPLATES[template_name]
    return template.format(**kwargs)

def get_qualification_questions() -> List[str]:
    """Get a list of qualification questions in order of priority."""
    return [
        "What's your role at your company?",
        "What company do you work for?",
        "What industry are you in?",
        "How large is your team?",
        "What tools are you currently using?",
        "What's your budget range for this solution?",
        "What's your timeline for making a decision?",
        "What specific problems are you trying to solve?"
    ]

def get_product_topics() -> List[str]:
    """Get common product topics for knowledge base."""
    return [
        "features and capabilities",
        "pricing and plans", 
        "implementation and onboarding",
        "integration options",
        "security and compliance",
        "customer support",
        "case studies and success stories",
        "competitor comparisons"
    ]
