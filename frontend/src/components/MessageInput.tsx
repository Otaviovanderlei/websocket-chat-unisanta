import { useState } from "react";
import { Icon } from "./Icon";

interface MessageInputProps {
  onSend: (content: string) => boolean;
  disabled: boolean;
  roomName: string;
}

export function MessageInput({
  onSend,
  disabled,
  roomName,
}: MessageInputProps) {
  const [content, setContent] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (disabled || !normalizedContent) {
      return;
    }

    if (onSend(normalizedContent)) setContent("");
  }

  return (
    <div className="composer">
    <form
      className="message-form"
      onSubmit={handleSubmit}
    >
      <input
        aria-label={`Mensagem para ${roomName}`}
        aria-describedby="composer-hint"
        type="text"
        placeholder="Digite sua mensagem..."
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled || !content.trim()}
        aria-label="Enviar mensagem"
        title="Enviar mensagem (Enter)"
      >
        <span>Enviar</span><Icon name="send" />
      </button>
    </form>
    <p className="composer-hint" id="composer-hint">{disabled ? "Sem conexão. Recarregue a página para tentar conectar novamente." : "Pressione Enter para enviar. Todos na sala podem ver suas mensagens."}</p>
    </div>
  );
}
   
