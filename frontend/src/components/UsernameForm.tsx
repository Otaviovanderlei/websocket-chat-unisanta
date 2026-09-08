import { useState } from "react";

interface UsernameFormProps {
  onEnter: (username: string) => void;
}

export function UsernameForm({
  onEnter,
}: UsernameFormProps) {
  const [username, setUsername] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      return;
    }

    onEnter(normalizedUsername);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>WebSocket Chat</h1>

      <p>Informe seu nome para entrar no chat.</p>

      <input
        type="text"
        placeholder="Seu nome"
        value={username}
        onChange={(event) =>
          setUsername(event.target.value)
        }
      />

      <button type="submit">
        Entrar
      </button>
    </form>
  );
}