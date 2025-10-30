import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { FloorplanScene } from '../../../../scenes/FloorplanScene';
import { FloorplanEditorState } from '../FloorplanEditor/FloorplanEditor';
import { RoomManager } from '@polaris/renderer';
import './FloorplanCanvas.scss';

interface FloorplanCanvasProps {
  state: FloorplanEditorState;
  onSaveRequest?: () => void;
}

export function FloorplanCanvas({ state, onSaveRequest }: FloorplanCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<FloorplanScene | null>(null);

  useEffect(() => {
    if (onSaveRequest) {
      (window as any).getFloorplanData = () => {
        if (sceneRef.current) {
          return sceneRef.current.exportPattern();
        }
        return null;
      };
    }
  }, [onSaveRequest]);

  useEffect(() => {
    if (gameRef.current) return;

    setTimeout(() => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1000,
        height: 700,
        parent: 'floorplan-phaser-container',
        backgroundColor: '#1a1b1e',
        scene: FloorplanScene,
        scale: {
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.NO_CENTER
        }
      };

      gameRef.current = new Phaser.Game(config);

      gameRef.current.events.once('ready', () => {
        sceneRef.current = gameRef.current?.scene.getScene('FloorplanScene') as FloorplanScene;

        const roomManager = new RoomManager();
        const roomData = roomManager.getRoomData();
        sceneRef.current.loadFromRoomData(roomData);
      });
    }, 100);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateConfig({
        currentAction: state.currentAction,
        currentHeight: state.currentHeight,
        doorDirection: state.doorDirection
      });
    }
  }, [state.currentAction, state.currentHeight, state.doorDirection]);

  return (
    <div className="floorplan-canvas">
      <div className="canvas-container">
        <div id="floorplan-phaser-container" />
      </div>
    </div>
  );
}
