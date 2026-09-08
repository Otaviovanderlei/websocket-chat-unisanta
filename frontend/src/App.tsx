import { useState } from "react";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { UsernameForm } from "./components/UsernameForm";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
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
    sendMessage(username, content);
  }

  function handleLogout() {
    sessionStorage.removeItem("username");
    setUsername("");
  }

  if (!username) {
    return (
      <UsernameForm
        onEnter={handleEnter}
      />
    );
  }

  return (
    <main>
      <header>
        <h1>WebSocket Chat</h1>

        <ConnectionStatus
          isConnected={isConnected}
        />

        <span>
          Usuário: {username}
        </span>

        <button onClick={handleLogout}>
          Trocar usuário
        </button>
      </header>

      <MessageList
        messages={messages}
        currentUsername={username}
      />

      <MessageInput
        disabled={!isConnected}
        onSend={handleSend}
      />
    </main>
  );
}

export default App;