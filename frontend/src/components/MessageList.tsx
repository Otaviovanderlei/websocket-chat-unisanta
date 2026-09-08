import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/ChatMessage";

interface MessageListProps {
  messages: ChatMessage[];
  currentUsername: string;
}

export function MessageList({
  messages,
  currentUsername,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isOwnMessage =
          message.sender === currentUsername;

        return (
          <div
            key={index}
            className={
              isOwnMessage
                ? "message-row own-message"
                : "message-row other-message"
            }
          >
            <div className="message-bubble">
              <strong>{message.sender}</strong>

              <p>{message.content}</p>

              <small>
                {new Date(
                  message.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}