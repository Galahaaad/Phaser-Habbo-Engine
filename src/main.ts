import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { LoaderScene } from '@scenes/LoaderScene';
import { RoomScene } from '@scenes/RoomScene';

const config: Phaser.Types.Core.GameConfig = {
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

const game = new Phaser.Game(config);

if (import.meta.env?.DEV) {
  (window as any).game = game;
}