// Shared types for Toxic Intelligence Platform

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_name: string;
  sender_type: "SELF" | "OTHER" | "SYSTEM";
  text: string;
  timestamp: string | null;
  toxicity_score: number | null;
  sentiment_score: number | null;
  flags: string[] | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  avg_toxicity_overall: number;
  avg_toxicity_self: number;
  avg_toxicity_other: number;
  sentiment_overall: number;
  conflict_days_count: number;
  breakup_risk_score: number;
  last_calculated_at: string;
}

export interface ParsedMessage {
  sender_name: string;
  sender_type: "SELF" | "OTHER" | "SYSTEM";
  text: string;
}

export interface AnalysisResult {
  toxicity_score: number;
  sentiment_score: number;
  flags: string[];
}

export interface CreateConversationRequest {
  title: string;
  description?: string;
}

export interface ImportMessagesRequest {
  raw: string;
}

export interface ImportMessagesResponse {
  imported: number;
}

export interface JWTPayload {
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  role?: string;
}
