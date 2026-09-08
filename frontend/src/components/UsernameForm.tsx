import { useState } from "react";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";

interface UsernameFormProps {
  onEnter: (username: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function UsernameForm({
  onEnter,
  theme,
  onToggleTheme,
}: UsernameFormProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setError("Digite seu nome para entrar na conversa.");
      return;
    }

    onEnter(normalizedUsername);
  }

  return (
    <main className="entry-page">
      <div className="entry-brand"><span className="brand-mark"><Icon name="chat" /></span><strong>WebSocket Chat</strong><span className="entry-university">UNISANTA</span><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div className="username-container">
      <form onSubmit={handleSubmit} noValidate>
        <span className="entry-icon"><Icon name="chat" /></span>
        <span className="eyebrow">MENOS DISTÂNCIA. MAIS CONVERSA.</span>
        <h1>WebSocket Chat</h1>

        <p className="entry-description">Converse em tempo real de qualquer lugar.<br />Sua próxima conversa começa aqui.</p>

        <label htmlFor="username">Nome de exibição</label>
        <input
          id="username"
          autoComplete="nickname"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "username-error" : "username-hint"}
          type="text"
          placeholder="Como você gostaria de ser chamado?"
          value={username}
          onChange={(event) => { setUsername(event.target.value); setError(""); }}
        />

        {error ? <p className="form-error" id="username-error" role="alert">{error}</p> : <p className="field-hint" id="username-hint">Esse nome será visível nas salas em que você conversar.</p>}
        <button type="submit">
          Entrar no chat <span aria-hidden="true">→</span>
        </button>
        <div className="entry-footnote"><span className="status-dot" aria-hidden="true" />Comunicação em tempo real</div>
      </form>
      </div>
      <footer className="entry-footer">Um espaço para compartilhar ideias.<span>WebSocket Chat · UNISANTA</span></footer>
    </main>
  );
}
