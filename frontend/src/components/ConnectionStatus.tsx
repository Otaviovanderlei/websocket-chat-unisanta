interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  return (
    <span className={`connection-status ${isConnected ? "connected" : "disconnected"}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      {isConnected ? "Conectado" : "Desconectado"}
    </span>
  );
}
