// Supabase server/edge client helpers
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServerClient = ReturnType<typeof createClient<any, "toxic">>;

// Create a Supabase client with service role key for server-side operations
export function createSupabaseServerClient(): SupabaseServerClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "toxic",
    },
  });
}

// Verify JWT and extract user ID
export async function verifyAuthAndGetUserId(
  request: Request
): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return { error: "JWT secret not configured", status: 500 };
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      return { error: "Invalid token: missing sub claim", status: 401 };
    }

    return { userId: sub };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return { error: "Invalid or expired token", status: 401 };
  }
}

// Helper to check if user owns a conversation
export async function verifyConversationOwnership(
  supabase: SupabaseServerClient,
  conversationId: string,
  userId: string
): Promise<{ valid: true } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .single();

  if (error || !data) {
    return { error: "Conversation not found", status: 404 };
  }

  if (data.user_id !== userId) {
    return { error: "Access denied", status: 403 };
  }

  return { valid: true };
}

// JSON response helper
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Error response helper
export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
