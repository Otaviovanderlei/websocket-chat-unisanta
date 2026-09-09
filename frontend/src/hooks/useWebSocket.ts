import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/ChatMessage";
import { isChatMessage, mergeMessages } from "../utils/messages";

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;
const EMPTY_MESSAGES: ChatMessage[] = [];

export function useWebSocket(currentRoom: string) {
  const connectionRef = useRef<{ roomId: string; socket: WebSocket } | null>(null);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [connectedSocket, setConnectedSocket] = useState<{ roomId: string; socket: WebSocket } | null>(null);
  const [history, setHistory] = useState({ roomId: currentRoom, loading: true, error: "" });

  // Reset before rendering the new room, including when revisiting a cached room.
  if (history.roomId !== currentRoom) {
    setHistory({ roomId: currentRoom, loading: true, error: "" });
  }

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
          !isChatMessage(message) || message.roomId !== currentRoom
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
          [received.roomId]: mergeMessages(rooms[received.roomId] ?? [], [received]),
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

  useEffect(() => {
    const controller = new AbortController();
    async function loadHistory() {
      try {
        if (!API_URL) throw new Error("Configure VITE_API_URL para carregar o histórico.");
        const url = new URL("/api/messages", API_URL);
        url.searchParams.set("roomId", currentRoom);
        url.searchParams.set("limit", "50");
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Histórico indisponível: HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (!Array.isArray(data) || !data.every(isChatMessage)) {
          throw new Error("Formato de histórico inválido.");
        }
        const incoming = data.filter((message) => message.roomId === currentRoom);
        setMessagesByRoom((rooms) => controller.signal.aborted ? rooms : ({
          ...rooms,
          [currentRoom]: mergeMessages(rooms[currentRoom] ?? [], incoming),
        }));
        setHistory({ roomId: currentRoom, loading: false, error: "" });
      } catch {
        if (controller.signal.aborted) return;
        setHistory({ roomId: currentRoom, loading: false, error: "Não foi possível carregar o histórico." });
      }
    }
    void loadHistory();
    return () => controller.abort();
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
    isHistoryLoading: history.roomId !== currentRoom || history.loading,
    historyError: history.roomId === currentRoom ? history.error : "",
    isConnected: connectedSocket?.roomId === currentRoom &&
      connectedSocket.socket.readyState === WebSocket.OPEN,
    sendMessage,
  };
}

