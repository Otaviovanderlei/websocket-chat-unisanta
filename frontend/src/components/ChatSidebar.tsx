import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { ConnectionStatus } from "./ConnectionStatus";
import { CHAT_ROOMS, type ChatRoom } from "../config/chatRooms";
import { UnisantaLogo } from "./UnisantaLogo";

interface ChatSidebarProps {
  username: string;
  isConnected: boolean;
  currentRoom: ChatRoom;
  onRoomSelect: (room: ChatRoom) => void;
}

export function ChatSidebar({ username, isConnected, currentRoom, onRoomSelect }: ChatSidebarProps) {
  return <aside className="chat-sidebar" aria-label="Conversas">
    <UnisantaLogo variant="sidebar" />
    <div className="brand"><span className="brand-mark"><Icon name="chat" /></span><div><strong>PeopleWare Chat</strong><small>UNISANTA · Turma B</small></div></div>
    <div className="section-label">Conversas <span>{String(CHAT_ROOMS.length).padStart(2, "0")}</span></div>
    <nav className="room-list" aria-label="Salas de conversa">
      {CHAT_ROOMS.map((room) => <button type="button" key={room.id} className="room-item" aria-pressed={currentRoom.id === room.id} onClick={() => onRoomSelect(room)}>
        <span className="room-symbol" aria-hidden="true">#</span><span><strong>{room.name}</strong><small>{room.description}</small></span>{currentRoom.id === room.id && <span className="selected-dot" aria-hidden="true" />}
      </button>)}
    </nav>
    <div className="sidebar-note"><Icon name="chat" /><strong>Boas conversas começam aqui.</strong><p>Um espaço compartilhado para trocar ideias e encurtar distâncias.</p></div>
    <div className="sidebar-user"><Avatar name={username} /><div><strong title={username}>{username}</strong><ConnectionStatus isConnected={isConnected} /></div></div>
  </aside>;
}
