// NVIDIA LLM helper for message analysis
import type { AnalysisResult, ParsedMessage } from "./types";

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are a chat message analyzer for the Toxic Intelligence Platform.

Your task is to analyze a list of chat messages and return toxicity, sentiment, and flags for each message.

For each message, you must provide:
1. toxicity_score: A number from 0 to 1 where 0 = not toxic at all, 1 = extremely toxic
2. sentiment_score: A number from -1 to 1 where -1 = very negative, 0 = neutral, 1 = very positive
3. flags: An array of strings describing concerning patterns. Possible flags include:
   - "passive_aggressive" - indirect hostility or sarcasm
   - "insult" - direct insults or name-calling
   - "gaslighting" - manipulating someone to question their reality
   - "dismissive" - ignoring or invalidating feelings
   - "threatening" - explicit or implicit threats
   - "guilt_tripping" - using guilt to manipulate
   - "stonewalling" - refusing to communicate
   - "love_bombing" - excessive flattery or attention (potentially manipulative)
   - "blame_shifting" - avoiding responsibility by blaming others

You MUST respond with ONLY a valid JSON array containing one analysis object for each input message, in the same order.

Example input:
[
  {"text": "ทำไมไม่ตอบไลน์", "sender_type": "SELF"},
  {"text": "ก็งานยุ่ง", "sender_type": "OTHER"}
]

Example output:
[
  {"toxicity_score": 0.3, "sentiment_score": -0.2, "flags": ["passive_aggressive"]},
  {"toxicity_score": 0.1, "sentiment_score": -0.1, "flags": ["dismissive"]}
]

Analyze both Thai and English messages. Return ONLY the JSON array, no other text.`;

export async function analyzeMessages(
  messages: ParsedMessage[]
): Promise<AnalysisResult[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  // Prepare messages for analysis
  const messagesToAnalyze = messages.map((m) => ({
    text: m.text,
    sender_type: m.sender_type,
  }));

  const requestBody = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(messagesToAnalyze) },
    ],
    temperature: 0.3,
    top_p: 1,
    max_tokens: 2048,
    stream: false,
  };

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("NVIDIA API error:", response.status, errorText);
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract the content from the completion
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Invalid response from NVIDIA API: missing content");
  }

  // Parse the JSON response
  let analysisResults: AnalysisResult[];
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      analysisResults = JSON.parse(jsonMatch[0]);
    } else {
      analysisResults = JSON.parse(content);
    }
  } catch (parseError) {
    console.error("Failed to parse LLM response:", content);
    throw new Error("Failed to parse analysis results from LLM");
  }

  // Validate the structure
  if (!Array.isArray(analysisResults)) {
    throw new Error("Invalid analysis results: expected array");
  }

  if (analysisResults.length !== messages.length) {
    console.warn(
      `Analysis count mismatch: got ${analysisResults.length}, expected ${messages.length}`
    );
    // Pad or truncate as needed
    while (analysisResults.length < messages.length) {
      analysisResults.push({
        toxicity_score: 0,
        sentiment_score: 0,
        flags: [],
      });
    }
    analysisResults = analysisResults.slice(0, messages.length);
  }

  // Normalize and validate each result
  return analysisResults.map((result) => ({
    toxicity_score: clamp(Number(result.toxicity_score) || 0, 0, 1),
    sentiment_score: clamp(Number(result.sentiment_score) || 0, -1, 1),
    flags: Array.isArray(result.flags)
      ? result.flags.filter((f) => typeof f === "string")
      : [],
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
