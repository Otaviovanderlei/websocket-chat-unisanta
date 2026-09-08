export const CHAT_ROOMS = [
  { id: "geral", name: "Sala Geral", description: "Um espaço para conversar" },
  { id: "frontend", name: "Frontend", description: "Interfaces, ideias e experiências" },
  { id: "backend", name: "Backend", description: "Serviços, dados e conexões" },
] as const;

export type ChatRoom = (typeof CHAT_ROOMS)[number];
