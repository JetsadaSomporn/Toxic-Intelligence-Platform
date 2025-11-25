// Raw chat parsing utilities
import type { ParsedMessage } from "./types";

/**
 * Parse raw chat text into structured messages
 *
 * Rules:
 * - For each non-empty line:
 *   - If line matches "Name: message", extract sender_name and text
 *   - sender_type:
 *     - If sender_name is "กู" or "me" (case-insensitive), then SELF
 *     - Else OTHER
 *   - If line does not contain ":", treat as SYSTEM message
 *
 * @param raw - Multi-line raw chat text
 * @returns Array of parsed messages
 */
export function parseRawChat(raw: string): ParsedMessage[] {
  const lines = raw.split("\n");
  const messages: ParsedMessage[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Check if line contains a colon (Name: message format)
    const colonIndex = trimmedLine.indexOf(":");

    if (colonIndex > 0) {
      // Has colon - extract sender name and message
      const senderName = trimmedLine.substring(0, colonIndex).trim();
      const text = trimmedLine.substring(colonIndex + 1).trim();

      // Skip if either part is empty
      if (!senderName || !text) {
        // Treat as SYSTEM if message part is empty
        messages.push({
          sender_name: "SYSTEM",
          sender_type: "SYSTEM",
          text: trimmedLine,
        });
        continue;
      }

      // Determine sender type
      const senderType = isSelf(senderName) ? "SELF" : "OTHER";

      messages.push({
        sender_name: senderName,
        sender_type: senderType,
        text: text,
      });
    } else {
      // No colon - treat as SYSTEM message
      messages.push({
        sender_name: "SYSTEM",
        sender_type: "SYSTEM",
        text: trimmedLine,
      });
    }
  }

  return messages;
}

/**
 * Check if sender name indicates self
 * @param name - Sender name to check
 * @returns true if name indicates self
 */
function isSelf(name: string): boolean {
  const lowerName = name.toLowerCase().trim();
  return lowerName === "กู" || lowerName === "me";
}
