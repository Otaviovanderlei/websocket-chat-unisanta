import { ConnectionStatus } from "./components/ConnectionStatus";
import { MessageInput } from "./components/MessageInput";
import { MessageList } from "./components/MessageList";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const {
    messages,
    isConnected,
    sendMessage,
  } = useWebSocket();

  return (
    <main>
      <h1>WebSocket Chat</h1>

      <ConnectionStatus isConnected={isConnected} />

      <MessageList messages={messages} />

      <MessageInput
        disabled={!isConnected}
        onSend={sendMessage}
      />
    </main>
  );
}

export default App;