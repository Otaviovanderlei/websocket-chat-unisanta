import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { ConnectionStatus } from "./ConnectionStatus";

export function ChatSidebar({ username, isConnected }: { username: string; isConnected: boolean }) {
  return <aside className="chat-sidebar" aria-label="Conversas">
    <div className="brand"><span className="brand-mark"><Icon name="chat" /></span><div><strong>WebSocket Chat</strong><small>UNISANTA · CONECTE-SE</small></div></div>
    <div className="section-label">Conversas <span>01</span></div>
    <a className="room-item" href="#conversation" aria-current="page"><span className="room-symbol">#</span><span><strong>Sala Geral</strong><small>Um espaço para conversar</small></span><span className="selected-dot" /></a>
    <div className="sidebar-note"><Icon name="chat" /><strong>Boas conversas começam aqui.</strong><p>Um espaço compartilhado para trocar ideias e encurtar distâncias.</p></div>
    <div className="sidebar-user"><Avatar name={username} /><div><strong title={username}>{username}</strong><ConnectionStatus isConnected={isConnected} /></div></div>
  </aside>;
}
