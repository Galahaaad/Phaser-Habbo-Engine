import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import { BootScene } from '@scenes/BootScene';
import { LoaderScene } from '@scenes/LoaderScene';
import { RoomScene } from '@scenes/RoomScene';
import { App } from '@ui/layouts';

const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 768,
  backgroundColor: '#2d2d2d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: true,
    antialias: false
  },
  scene: [BootScene, LoaderScene, RoomScene]
};

const game = new Phaser.Game(phaserConfig);

// @ts-ignore
if (import.meta.env?.DEV) {
  (window as any).game = game;
}

const reactRoot = document.getElementById('react-root');
if (reactRoot) {
  createRoot(reactRoot).render(<App />);
}
