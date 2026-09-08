import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/ChatMessage";

const WS_URL = import.meta.env.VITE_WS_URL;
const EMPTY_MESSAGES: ChatMessage[] = [];

export function useWebSocket(currentRoom: string) {
  const connectionRef = useRef<{ roomId: string; socket: WebSocket } | null>(null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [connectedSocket, setConnectedSocket] = useState<{ roomId: string; socket: WebSocket } | null>(null);

  useEffect(() => {
    let socket: WebSocket;
    try {
      if (!WS_URL) throw new Error("Configure VITE_WS_URL para conectar ao chat.");
      const url = new URL(WS_URL);
      url.searchParams.set("roomId", currentRoom);
      socket = new WebSocket(url.toString());
    } catch (error) {
      console.error("Não foi possível conectar ao chat:", error);
      return;
    }

    connectionRef.current = { roomId: currentRoom, socket };
    const isCurrentSocket = () => connectionRef.current?.socket === socket;

    socket.onopen = () => {
      if (isCurrentSocket()) setConnectedSocket({ roomId: currentRoom, socket });
    };
    socket.onmessage = (event) => {
      if (!isCurrentSocket()) return;
      try {
        const message: unknown = JSON.parse(event.data);
        if (
          typeof message !== "object" || message === null ||
          !("sender" in message) || typeof message.sender !== "string" ||
          !("content" in message) || typeof message.content !== "string" ||
          !("timestamp" in message) || typeof message.timestamp !== "string" ||
          !("roomId" in message) || message.roomId !== currentRoom
        ) {
          console.error("Mensagem inválida ou de outra sala recebida.");
          return;
        }
        const received: ChatMessage = {
          sender: message.sender, content: message.content,
          timestamp: message.timestamp, roomId: message.roomId,
        };
        setMessagesByRoom((rooms) => ({
          ...rooms,
          [received.roomId]: [...(rooms[received.roomId] ?? []), received],
        }));
      } catch {
        console.error("Mensagem inválida recebida.");
      }
    };
    socket.onerror = () => {
      if (isCurrentSocket()) setConnectedSocket(null);
    };
    socket.onclose = () => {
      if (isCurrentSocket()) setConnectedSocket(null);
    };

    return () => {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (connectionRef.current?.socket === socket) connectionRef.current = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [currentRoom]);

  const sendMessage = useCallback((sender: string, content: string) => {
    const connection = connectionRef.current;
    if (!content.trim() || !connection || connection.roomId !== currentRoom ||
        connection.socket !== connectedSocket?.socket || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      connection.socket.send(JSON.stringify({ sender, content }));
      return true;
    } catch {
      return false;
    }
  }, [currentRoom, connectedSocket]);

  return {
    messages: messagesByRoom[currentRoom] ?? EMPTY_MESSAGES,
    isConnected: connectedSocket?.roomId === currentRoom &&
      connectedSocket.socket.readyState === WebSocket.OPEN,
    sendMessage,
  };
}

