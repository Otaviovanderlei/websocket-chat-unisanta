import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/ChatMessage";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

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
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <div className="message-list" role="log" aria-label="Mensagens da Sala Geral" aria-live="polite" aria-relevant="additions" tabIndex={0}>
      {messages.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="chat" /></span><span className="eyebrow">SALA GERAL</span><h2>Uma conversa começa com um olá.</h2><p>Nenhuma mensagem ainda.<br />Envie uma mensagem para iniciar a conversa.</p><span className="empty-tag">Ideias, encontros e novas conexões.</span></div>}
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
              <strong className="message-sender">
                {message.sender}
              </strong>

              <p className="message-content">
                {message.content}
              </p>

              <small className="message-time">
                {new Date(
                  message.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
            <Avatar name={message.sender} />
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
