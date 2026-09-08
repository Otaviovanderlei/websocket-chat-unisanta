import { useState } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function MessageInput({
  onSend,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      return;
    }

    onSend(normalizedContent);

    setContent("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Digite sua mensagem"
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
      />

      <button
        type="submit"
        disabled={disabled}
      >
        Enviar
      </button>
    </form>
  );
}