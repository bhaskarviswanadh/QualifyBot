export type LeadData = {
  lead: {
    name: string | null;
    email: string | null;
    company: string | null;
    role: string | null;
    industry: string | null;
  };
  intent: string;
  score: number;
  top_signals: string[];
  recommended_action: string;
  explain: string;
  crm_tags: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SystemStatus = {
  api: boolean;
  gemini: boolean;
  crm: string;
};
