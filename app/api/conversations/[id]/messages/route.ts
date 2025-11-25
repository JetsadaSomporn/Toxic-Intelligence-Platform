// API Route: /api/conversations/[id]/messages
// GET - List messages for a conversation (with pagination)
// POST - Import raw chat and analyze

import {
  createSupabaseServerClient,
  verifyAuthAndGetUserId,
  verifyConversationOwnership,
  jsonResponse,
  errorResponse,
} from "@/lib/supabaseServer";
import { parseRawChat } from "@/lib/parsing";
import { analyzeMessages } from "@/lib/llm";
import type { ImportMessagesRequest, Message } from "@/lib/types";

export const runtime = "edge";

interface RouteParams {
  params: { id: string };
}

// GET /api/conversations/[id]/messages - List messages with pagination
export async function GET(request: Request, { params }: RouteParams) {
  const { id: conversationId } = params;

  // Verify auth
  const authResult = await verifyAuthAndGetUserId(request);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { userId } = authResult;
  const supabase = createSupabaseServerClient();

  // Verify ownership
  const ownershipResult = await verifyConversationOwnership(
    supabase,
    conversationId,
    userId
  );
  if ("error" in ownershipResult) {
    return errorResponse(ownershipResult.error, ownershipResult.status);
  }

  // Parse query parameters
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  let limit = 50;
  let offset = 0;

  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 200); // Max 200
    }
  }

  if (offsetParam) {
    const parsedOffset = parseInt(offsetParam, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      offset = parsedOffset;
    }
  }

  // Fetch messages
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, sender_name, sender_type, text, timestamp, toxicity_score, sentiment_score, flags, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching messages:", error);
    return errorResponse("Failed to fetch messages", 500);
  }

  return jsonResponse(data);
}

// POST /api/conversations/[id]/messages - Import and analyze raw chat
export async function POST(request: Request, { params }: RouteParams) {
  const { id: conversationId } = params;

  // Verify auth
  const authResult = await verifyAuthAndGetUserId(request);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { userId } = authResult;
  const supabase = createSupabaseServerClient();

  // Verify ownership
  const ownershipResult = await verifyConversationOwnership(
    supabase,
    conversationId,
    userId
  );
  if ("error" in ownershipResult) {
    return errorResponse(ownershipResult.error, ownershipResult.status);
  }

  // Parse request body
  let body: ImportMessagesRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  // Validate raw field
  if (!body.raw || typeof body.raw !== "string") {
    return errorResponse("raw field is required and must be a string", 400);
  }

  // Parse raw chat
  const parsedMessages = parseRawChat(body.raw);

  if (parsedMessages.length === 0) {
    return errorResponse("No messages found in raw chat", 400);
  }

  // Analyze messages with LLM
  let analysisResults;
  try {
    analysisResults = await analyzeMessages(parsedMessages);
  } catch (error) {
    console.error("LLM analysis failed:", error);
    // Continue with default values if LLM fails
    analysisResults = parsedMessages.map(() => ({
      toxicity_score: 0,
      sentiment_score: 0,
      flags: [],
    }));
  }

  // Prepare messages for insertion
  const messagesToInsert = parsedMessages.map((msg, index) => ({
    conversation_id: conversationId,
    sender_name: msg.sender_name,
    sender_type: msg.sender_type,
    text: msg.text,
    timestamp: null, // Not parsing timestamps for now
    toxicity_score: analysisResults[index]?.toxicity_score ?? null,
    sentiment_score: analysisResults[index]?.sentiment_score ?? null,
    flags: analysisResults[index]?.flags ?? null,
  }));

  // Insert messages
  const { error: insertError } = await supabase
    .from("messages")
    .insert(messagesToInsert);

  if (insertError) {
    console.error("Error inserting messages:", insertError);
    return errorResponse("Failed to insert messages", 500);
  }

  // Recompute summary
  await recomputeSummary(supabase, conversationId);

  return jsonResponse({ imported: parsedMessages.length }, 201);
}

// Helper type for message data from Supabase
interface MessageData {
  toxicity_score: number | null;
  sentiment_score: number | null;
  sender_type: string;
  created_at: string;
}

// Helper function to recompute conversation summary
async function recomputeSummary(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  conversationId: string
) {
  // Fetch all messages for this conversation
  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      "toxicity_score, sentiment_score, sender_type, created_at"
    )
    .eq("conversation_id", conversationId);

  if (error || !messages) {
    console.error("Error fetching messages for summary:", error);
    return;
  }

  const typedMessages = messages as MessageData[];

  // Filter messages with valid scores
  const messagesWithToxicity = typedMessages.filter(
    (m: MessageData) => m.toxicity_score !== null
  );
  const messagesWithSentiment = typedMessages.filter(
    (m: MessageData) => m.sentiment_score !== null
  );

  // Calculate averages
  const avgToxicityOverall =
    messagesWithToxicity.length > 0
      ? messagesWithToxicity.reduce((sum: number, m: MessageData) => sum + m.toxicity_score!, 0) /
        messagesWithToxicity.length
      : 0;

  const selfMessages = messagesWithToxicity.filter(
    (m: MessageData) => m.sender_type === "SELF"
  );
  const avgToxicitySelf =
    selfMessages.length > 0
      ? selfMessages.reduce((sum: number, m: MessageData) => sum + m.toxicity_score!, 0) /
        selfMessages.length
      : 0;

  const otherMessages = messagesWithToxicity.filter(
    (m: MessageData) => m.sender_type === "OTHER"
  );
  const avgToxicityOther =
    otherMessages.length > 0
      ? otherMessages.reduce((sum: number, m: MessageData) => sum + m.toxicity_score!, 0) /
        otherMessages.length
      : 0;

  const sentimentOverall =
    messagesWithSentiment.length > 0
      ? messagesWithSentiment.reduce((sum: number, m: MessageData) => sum + m.sentiment_score!, 0) /
        messagesWithSentiment.length
      : 0;

  // Count conflict days (days with average toxicity >= 0.5)
  const dayGroups: Record<string, number[]> = {};
  for (const msg of messagesWithToxicity) {
    const day = msg.created_at.substring(0, 10); // YYYY-MM-DD
    if (!dayGroups[day]) {
      dayGroups[day] = [];
    }
    dayGroups[day].push(msg.toxicity_score!);
  }

  let conflictDaysCount = 0;
  for (const day in dayGroups) {
    const scores = dayGroups[day];
    const avgDayToxicity = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avgDayToxicity >= 0.5) {
      conflictDaysCount++;
    }
  }

  // Calculate breakup risk score
  const breakupRiskScore = clamp(
    avgToxicityOverall * 0.6 + conflictDaysCount * 0.05,
    0,
    1
  );

  // Upsert summary
  const { error: upsertError } = await supabase
    .from("conversation_summary")
    .upsert(
      {
        conversation_id: conversationId,
        avg_toxicity_overall: avgToxicityOverall,
        avg_toxicity_self: avgToxicitySelf,
        avg_toxicity_other: avgToxicityOther,
        sentiment_overall: sentimentOverall,
        conflict_days_count: conflictDaysCount,
        breakup_risk_score: breakupRiskScore,
        last_calculated_at: new Date().toISOString(),
      },
      {
        onConflict: "conversation_id",
      }
    );

  if (upsertError) {
    console.error("Error upserting summary:", upsertError);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
