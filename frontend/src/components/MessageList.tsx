import type { ChatMessage } from "../types/ChatMessage";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({messages,}: MessageListProps) {
  return (
    <div>
      {messages.map((message, index) => (
        <div key={index}>
          <strong>{message.sender}</strong>

          <p>{message.content}</p>

          <small> {new Date(message.timestamp).toLocaleTimeString()}</small>

          <hr />
        </div>
      ))}
    </div>
  );
}