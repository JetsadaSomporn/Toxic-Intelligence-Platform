// API Route: /api/conversations/[id]/summary
// GET - Get conversation summary

import {
  createSupabaseServerClient,
  verifyAuthAndGetUserId,
  verifyConversationOwnership,
  jsonResponse,
  errorResponse,
} from "@/lib/supabaseServer";

export const runtime = "edge";

interface RouteParams {
  params: { id: string };
}

// GET /api/conversations/[id]/summary - Get conversation summary
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

  // Fetch summary
  const { data, error } = await supabase
    .from("conversation_summary")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    console.error("Error fetching summary:", error);
    return errorResponse("Failed to fetch summary", 500);
  }

  // Return default summary if not yet computed
  if (!data) {
    return jsonResponse({
      conversation_id: conversationId,
      avg_toxicity_overall: 0,
      avg_toxicity_self: 0,
      avg_toxicity_other: 0,
      sentiment_overall: 0,
      conflict_days_count: 0,
      breakup_risk_score: 0,
      last_calculated_at: null,
    });
  }

  return jsonResponse(data);
}
