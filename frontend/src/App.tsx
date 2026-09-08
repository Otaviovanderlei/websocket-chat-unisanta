import { useState } from "react";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { UsernameForm } from "./components/UsernameForm";
import { useWebSocket } from "./hooks/useWebSocket";
import { ChatSidebar } from "./components/ChatSidebar";
import { Icon } from "./components/Icon";
import { ThemeToggle } from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";

function App() {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem("username") ?? "";
  });

  const {
    messages,
    isConnected,
    sendMessage,
  } = useWebSocket();

  function handleEnter(username: string) {
    sessionStorage.setItem("username", username);
    setUsername(username);
  }

  function handleSend(content: string) {
    return sendMessage(username, content);
  }

  function handleLogout() {
    sessionStorage.removeItem("username");
    setUsername("");
  }

  if (!username) {
    return (
      <UsernameForm
        onEnter={handleEnter}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <main className="chat-layout">
      <ChatSidebar username={username} isConnected={isConnected} />
      <section className="conversation" id="conversation" aria-labelledby="room-title">
      <header className="chat-header">
        <span className="room-symbol" aria-hidden="true">#</span>
        <div className="chat-heading"><h1 id="room-title">Sala Geral</h1><p>Chat em tempo real <span>· Aberto a todos</span></p></div>
        <div className="header-actions"><ConnectionStatus isConnected={isConnected} /><ThemeToggle theme={theme} onToggle={toggleTheme} /><button className="switch-user" onClick={handleLogout} title={`Trocar usuário (${username})`} aria-label={`Trocar usuário (${username})`}><Icon name="logout" /><span>Trocar usuário</span></button></div>
      </header>

      <MessageList
        messages={messages}
        currentUsername={username}
      />

      <MessageInput
        disabled={!isConnected}
        onSend={handleSend}
      />
      </section>
    </main>
  );
}

export default App;
