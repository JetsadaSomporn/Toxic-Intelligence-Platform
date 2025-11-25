// API Route: /api/conversations
// GET - List all conversations for the current user
// POST - Create a new conversation

import {
  createSupabaseServerClient,
  verifyAuthAndGetUserId,
  jsonResponse,
  errorResponse,
} from "@/lib/supabaseServer";
import type { CreateConversationRequest } from "@/lib/types";

export const runtime = "edge";

// GET /api/conversations - List user's conversations
export async function GET(request: Request) {
  // Verify auth
  const authResult = await verifyAuthAndGetUserId(request);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { userId } = authResult;
  const supabase = createSupabaseServerClient();

  // Fetch conversations for this user
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return errorResponse("Failed to fetch conversations", 500);
  }

  return jsonResponse(data);
}

// POST /api/conversations - Create a new conversation
export async function POST(request: Request) {
  // Verify auth
  const authResult = await verifyAuthAndGetUserId(request);
  if ("error" in authResult) {
    return errorResponse(authResult.error, authResult.status);
  }

  const { userId } = authResult;

  // Parse request body
  let body: CreateConversationRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  // Validate required fields
  if (!body.title || typeof body.title !== "string") {
    return errorResponse("title is required and must be a string", 400);
  }

  const supabase = createSupabaseServerClient();

  // Insert new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: body.title,
      description: body.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return errorResponse("Failed to create conversation", 500);
  }

  return jsonResponse(data, 201);
}
