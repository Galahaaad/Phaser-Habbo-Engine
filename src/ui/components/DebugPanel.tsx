import { useGameStore } from '@core/store';
import './DebugPanel.scss';

export function DebugPanel() {
  const roomName = useGameStore((state) => state.roomName);
  const avatarPosition = useGameStore((state) => state.avatarPosition);
  const isAvatarMoving = useGameStore((state) => state.isAvatarMoving);
  const chatMessages = useGameStore((state) => state.chatMessages);

  return (
    <div className="debug-panel">
      <h3>React UI Layer - Active</h3>
      <div className="debug-info">
        <p><strong>Room:</strong> {roomName || 'N/A'}</p>
        <p>
          <strong>Avatar:</strong> ({avatarPosition.x}, {avatarPosition.y}, {avatarPosition.z})
          {isAvatarMoving && <span className="moving"> [WALKING]</span>}
        </p>
        <p><strong>Chat Messages:</strong> {chatMessages.length}</p>
      </div>
      <div className="status">
        <span className="dot"></span> Zustand Store Connected
      </div>
    </div>
  );
}
