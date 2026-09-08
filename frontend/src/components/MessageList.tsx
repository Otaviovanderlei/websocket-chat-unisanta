import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/ChatMessage";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

interface MessageListProps {
  messages: ChatMessage[];
  currentUsername: string;
  roomName: string;
  roomId: string;
}

export function MessageList({
  messages,
  currentUsername,
  roomName,
  roomId,
}: MessageListProps) {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const previousRoomRef = useRef(roomId);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    const roomChanged = previousRoomRef.current !== roomId;
    previousRoomRef.current = roomId;
    // Scroll only this list: scrollIntoView can also move its ancestors.
    list.scrollTo({
      top: list.scrollHeight,
      behavior: roomChanged || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [messages, roomId]);

  return (
    <div ref={messageListRef} className={`message-list${messages.length === 0 ? " is-empty" : ""}`} role="log" aria-label={`Mensagens de ${roomName}`} aria-live="polite" aria-relevant="additions" tabIndex={0}>
      {messages.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name="chat" /></span><span className="eyebrow">{roomName.toLocaleUpperCase("pt-BR")}</span><h2>Uma conversa começa com um olá.</h2><p>Nenhuma mensagem nesta sala.<br />Envie uma mensagem para iniciar a conversa.</p><span className="empty-tag">Ideias, encontros e novas conexões.</span></div>}
      {messages.map((message, index) => {
        const isOwnMessage =
          message.sender === currentUsername;

        return (
          <div
            key={`${roomId}-${index}`}
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

    </div>
  );
}
