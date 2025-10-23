import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { Tile } from '@data/types/RoomData';

export interface FloorStyle {
  id: string;
  color1: number;
  color2: number;
  pattern: 'solid' | 'checkered' | 'striped' | 'dotted';
}

export const FLOOR_STYLES: Record<string, FloorStyle> = {
  '101': { id: '101', color1: 0x8b7355, color2: 0xa0826d, pattern: 'checkered' },
  '102': { id: '102', color1: 0x4a4a4a, color2: 0x5a5a5a, pattern: 'checkered' },
  '103': { id: '103', color1: 0xc8b896, color2: 0xdbc9a6, pattern: 'striped' },
  '104': { id: '104', color1: 0x7c9eb2, color2: 0x8fadc0, pattern: 'checkered' },
};

export class FloorRenderer {
  private currentFloorType: string = '101';

  constructor(_scene: Phaser.Scene) {}

  public setFloorType(floorType: string): void {
    this.currentFloorType = floorType;
  }

  public renderTile(graphics: Phaser.GameObjects.Graphics, tile: Tile): void {
    const style = FLOOR_STYLES[this.currentFloorType] || FLOOR_STYLES['101'];

    const topLeft = IsometricEngine.tileToScreen(tile.x, tile.y, tile.height);
    const topRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y, tile.height);
    const bottomRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y + 1, tile.height);
    const bottomLeft = IsometricEngine.tileToScreen(tile.x, tile.y + 1, tile.height);

    const isAlternate = this.shouldUseAlternateColor(tile, style.pattern);
    const fillColor = isAlternate ? style.color2 : style.color1;

    graphics.fillStyle(tile.isBlocked ? 0xff0000 : fillColor, tile.isBlocked ? 0.3 : 1);

    graphics.beginPath();
    graphics.moveTo(topLeft.x, topLeft.y);
    graphics.lineTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.strokePath();

    if (style.pattern === 'dotted') {
      this.addDottedPattern(graphics, topLeft, topRight, bottomRight, bottomLeft);
    }
  }

  private shouldUseAlternateColor(tile: Tile, pattern: string): boolean {
    switch (pattern) {
      case 'checkered':
        return (tile.x + tile.y) % 2 === 0;
      case 'striped':
        return tile.x % 2 === 0;
      case 'dotted':
        return false;
      default:
        return false;
    }
  }

  private addDottedPattern(
    graphics: Phaser.GameObjects.Graphics,
    topLeft: { x: number; y: number },
    topRight: { x: number; y: number },
    bottomRight: { x: number; y: number },
    bottomLeft: { x: number; y: number }
  ): void {
    const centerX = (topLeft.x + topRight.x + bottomRight.x + bottomLeft.x) / 4;
    const centerY = (topLeft.y + topRight.y + bottomRight.y + bottomLeft.y) / 4;

    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(centerX, centerY, 3);
  }
}
