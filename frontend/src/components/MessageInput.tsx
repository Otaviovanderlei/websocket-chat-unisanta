import { useState } from "react";

interface MessageInputProps {
  onSend: (sender: string, content: string) => void;
  disabled: boolean;
}

export function MessageInput({onSend,disabled,}: MessageInputProps) {
  const [sender, setSender] = useState("");
  const [content, setContent] = useState("");
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!sender.trim() || !content.trim()) {
      return;
    }
    onSend(sender, content);setContent("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Seu nome"
        value={sender}
        onChange={(event) => setSender(event.target.value)} />

      <input
        type="text"
        placeholder="Digite sua mensagem"
        value={content}
        onChange={(event) => setContent(event.target.value)}/>

      <button type="submit" disabled={disabled}>
        Enviar
      </button>
    </form>
  );
}