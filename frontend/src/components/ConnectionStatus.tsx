interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  return (
    <span>
      {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}
    </span>
  );
}