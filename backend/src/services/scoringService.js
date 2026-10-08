const INTENT_VALUES = new Set([
  'buy_soon',
  'considering',
  'researching',
  'not_interested',
]);

const ACTIONS = new Set([
  'schedule_demo',
  'send_pricing',
  'nurture_email',
  'send_ROI_report',
  'follow_up_call',
  'send_case_study',
]);

const emptyLead = () => ({
  lead: {
    name: null,
    email: null,
    company: null,
    role: null,
    industry: null,
  },
  intent: 'researching',
  score: 0,
  top_signals: [],
  recommended_action: 'nurture_email',
  explain: 'Not enough information yet.',
  crm_tags: ['low_priority'],
});

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function applyRuleBoosts(data, conversationText) {
  const text = (conversationText || '').toLowerCase();
  let score = clampScore(data.score);
  const signals = Array.isArray(data.top_signals) ? [...data.top_signals] : [];
  const tags = new Set(Array.isArray(data.crm_tags) ? data.crm_tags : []);

  const boosts = [
    { re: /\bbudget\b|\b\$\d|\bpricing\b/, amount: 12, signal: 'Budget/pricing discussed' },
    { re: /\btimeline\b|\bthis (month|quarter)|within \d+ (days|weeks|months)/, amount: 12, signal: 'Timeline mentioned' },
    { re: /\bdecision maker\b|\bv[pc]\b|\bdirector\b|\bhead of\b|\bfounder\b|\bceo\b/, amount: 10, signal: 'Decision maker identified' },
    { re: /\bpain\b|\bproblem\b|\bstruggl|\binefficient/, amount: 8, signal: 'Pain points clear' },
    { re: /\bteam\b|\breps?\b|\bemployees?\b/, amount: 5, signal: 'Team size mentioned' },
    { re: /\bsalesforce\b/, amount: 6, signal: 'Salesforce mentioned', tag: 'salesforce_migration' },
    { re: /\bhubspot\b/, amount: 6, signal: 'HubSpot mentioned', tag: 'hubspot_migration' },
  ];

  for (const b of boosts) {
    if (b.re.test(text)) {
      score += b.amount;
      if (!signals.includes(b.signal)) signals.push(b.signal);
      if (b.tag) tags.add(b.tag);
    }
  }

  score = clampScore(score);

  if (score >= 80) {
    tags.add('high_priority');
    tags.delete('medium_priority');
    tags.delete('low_priority');
  } else if (score >= 60) {
    tags.add('medium_priority');
    tags.delete('high_priority');
    tags.delete('low_priority');
  } else {
    tags.add('low_priority');
    tags.delete('high_priority');
    tags.delete('medium_priority');
  }

  let intent = INTENT_VALUES.has(data.intent) ? data.intent : 'researching';
  if (score >= 80 && intent === 'researching') intent = 'buy_soon';
  else if (score >= 60 && intent === 'researching') intent = 'considering';

  let action = ACTIONS.has(data.recommended_action)
    ? data.recommended_action
    : 'nurture_email';
  if (intent === 'buy_soon') action = action === 'nurture_email' ? 'schedule_demo' : action;

  return {
    ...data,
    lead: {
      name: data.lead?.name ?? null,
      email: data.lead?.email ?? null,
      company: data.lead?.company ?? null,
      role: data.lead?.role ?? null,
      industry: data.lead?.industry ?? null,
    },
    intent,
    score,
    top_signals: signals.slice(0, 5),
    recommended_action: action,
    explain: data.explain || 'Based on current conversation signals.',
    crm_tags: [...tags].slice(0, 6),
  };
}

export function normalizeLeadData(raw, conversationText = '') {
  const base = emptyLead();
  if (!raw || typeof raw !== 'object') {
    return applyRuleBoosts(base, conversationText);
  }

  const merged = {
    ...base,
    ...raw,
    lead: { ...base.lead, ...(raw.lead || {}) },
  };
  return applyRuleBoosts(merged, conversationText);
}

export { emptyLead };
