import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/ChatMessage.ts";
const WS_URL =
  import.meta.env.VITE_WS_URL ?? "wss://localhost:7079/ws";

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket conectado");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message: ChatMessage = JSON.parse(event.data);

        setMessages((currentMessages) => [
          ...currentMessages,message,
        ]);
      } catch (error) {
        console.error("Mensagem inválida recebida:", event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket desconectado");
      setIsConnected(false);
    };

   return () => {
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;

  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  ) {
    socket.close();
  }

  if (socketRef.current === socket) {
    socketRef.current = null;
  }
};
  }, []);

  const sendMessage = useCallback(
    (sender: string, content: string) => {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket não está conectado.");
        return false;
      }

      socket.send(
        JSON.stringify({sender,content,})
      );

      return true;
    },
    []
  );
  return {
    messages,isConnected,sendMessage,
  };
}