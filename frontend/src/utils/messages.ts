import type { ChatMessage } from "../types/ChatMessage";

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  return "sender" in value && typeof value.sender === "string" &&
    "content" in value && typeof value.content === "string" &&
    "roomId" in value && typeof value.roomId === "string" &&
    "timestamp" in value && typeof value.timestamp === "string" &&
    Number.isFinite(Date.parse(value.timestamp));
}

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const unique = new Map<string, ChatMessage>();
  for (const message of [...current, ...incoming]) {
    // JSON encoding avoids collisions when content contains separators.
    const key = JSON.stringify([message.sender, message.content, message.roomId, message.timestamp]);
    unique.set(key, message);
  }
  return [...unique.values()].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}
