import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { Tile } from '@data/types/RoomData';

export interface WallStyle {
  id: string;
  color: number;
  borderColor: number;
  pattern: 'solid' | 'paneled' | 'striped';
}

export const WALL_STYLES: Record<string, WallStyle> = {
  '101': { id: '101', color: 0xd4c5b9, borderColor: 0xa89985, pattern: 'paneled' },
  '102': { id: '102', color: 0x6b7d8f, borderColor: 0x4a5a6a, pattern: 'paneled' },
  '103': { id: '103', color: 0xf4e4d4, borderColor: 0xc9b99a, pattern: 'striped' },
};

export class WallRenderer {
  private currentWallType: string = '101';
  private wallHeight: number = 96;
  private wallThickness: number = 13;

  constructor(_scene: Phaser.Scene) {}

  public setWallType(wallType: string): void {
    this.currentWallType = wallType;
  }

  private darkenColor(color: number, factor: number = 0.8): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    return (
      (Math.floor(r * factor) << 16) |
      (Math.floor(g * factor) << 8) |
      Math.floor(b * factor)
    );
  }

  public renderWalls(
    graphics: Phaser.GameObjects.Graphics,
    tiles: Tile[][],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): void {
    const style = WALL_STYLES[this.currentWallType] || WALL_STYLES['101'];

    for (let y = minY; y <= maxY; y++) {
      if (y === minY || y === maxY) {
        for (let x = minX; x <= maxX; x++) {
          if (y === minY) {
            this.renderNorthWall(graphics, tiles[y][x], style);
          }
          if (y === maxY) {
            this.renderSouthWall(graphics, tiles[y][x], style);
          }
        }
      }
    }

    for (let x = minX; x <= maxX; x++) {
      if (x === minX) {
        for (let y = minY; y <= maxY; y++) {
          this.renderWestWall(graphics, tiles[y][x], style);
        }
      }
      if (x === maxX) {
        for (let y = minY; y <= maxY; y++) {
          this.renderEastWall(graphics, tiles[y][x], style);
        }
      }
    }
  }

  private renderNorthWall(graphics: Phaser.GameObjects.Graphics, tile: Tile, style: WallStyle): void {
    const bottom = IsometricEngine.tileToScreen(tile.x, tile.y, tile.height);
    const top = IsometricEngine.tileToScreen(tile.x, tile.y, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y, tile.height);
    const topRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomRightThick = { x: bottomRight.x, y: bottomRight.y + this.wallThickness };
    const topRightThick = { x: topRight.x, y: topRight.y + this.wallThickness };

    graphics.fillStyle(this.darkenColor(style.color, 0.7), 1);
    graphics.beginPath();
    graphics.moveTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.lineTo(bottomRightThick.x, bottomRightThick.y);
    graphics.lineTo(topRightThick.x, topRightThick.y);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(style.color, 1);
    graphics.beginPath();
    graphics.moveTo(bottom.x, bottom.y);
    graphics.lineTo(top.x, top.y);
    graphics.lineTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.closePath();
    graphics.fillPath();
  }

  private renderWestWall(graphics: Phaser.GameObjects.Graphics, tile: Tile, style: WallStyle): void {
    const bottom = IsometricEngine.tileToScreen(tile.x, tile.y, tile.height);
    const top = IsometricEngine.tileToScreen(tile.x, tile.y, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomLeft = IsometricEngine.tileToScreen(tile.x, tile.y + 1, tile.height);
    const topLeft = IsometricEngine.tileToScreen(tile.x, tile.y + 1, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomLeftThick = { x: bottomLeft.x, y: bottomLeft.y + this.wallThickness };
    const topLeftThick = { x: topLeft.x, y: topLeft.y + this.wallThickness };

    graphics.fillStyle(this.darkenColor(style.color, 0.6), 1);
    graphics.beginPath();
    graphics.moveTo(topLeft.x, topLeft.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.lineTo(bottomLeftThick.x, bottomLeftThick.y);
    graphics.lineTo(topLeftThick.x, topLeftThick.y);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(this.darkenColor(style.color, 0.85), 1);

    graphics.beginPath();
    graphics.moveTo(bottom.x, bottom.y);
    graphics.lineTo(top.x, top.y);
    graphics.lineTo(topLeft.x, topLeft.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.closePath();
    graphics.fillPath();
  }

  private renderEastWall(graphics: Phaser.GameObjects.Graphics, tile: Tile, style: WallStyle): void {
    const bottom = IsometricEngine.tileToScreen(tile.x + 1, tile.y, tile.height);
    const top = IsometricEngine.tileToScreen(tile.x + 1, tile.y, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y + 1, tile.height);
    const topRight = IsometricEngine.tileToScreen(tile.x + 1, tile.y + 1, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomRightThick = { x: bottomRight.x, y: bottomRight.y + this.wallThickness };
    const topRightThick = { x: topRight.x, y: topRight.y + this.wallThickness };

    graphics.fillStyle(this.darkenColor(style.color, 0.7), 1);
    graphics.beginPath();
    graphics.moveTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.lineTo(bottomRightThick.x, bottomRightThick.y);
    graphics.lineTo(topRightThick.x, topRightThick.y);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(style.color, 1);
    graphics.beginPath();
    graphics.moveTo(bottom.x, bottom.y);
    graphics.lineTo(top.x, top.y);
    graphics.lineTo(topRight.x, topRight.y);
    graphics.lineTo(bottomRight.x, bottomRight.y);
    graphics.closePath();
    graphics.fillPath();
  }

  private renderSouthWall(graphics: Phaser.GameObjects.Graphics, tile: Tile, style: WallStyle): void {
    const bottom = IsometricEngine.tileToScreen(tile.x, tile.y + 1, tile.height);
    const top = IsometricEngine.tileToScreen(tile.x, tile.y + 1, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomLeft = IsometricEngine.tileToScreen(tile.x + 1, tile.y + 1, tile.height);
    const topLeft = IsometricEngine.tileToScreen(tile.x + 1, tile.y + 1, tile.height + this.wallHeight / IsometricEngine.TILE_SCALE);

    const bottomLeftThick = { x: bottomLeft.x, y: bottomLeft.y + this.wallThickness };
    const topLeftThick = { x: topLeft.x, y: topLeft.y + this.wallThickness };

    graphics.fillStyle(this.darkenColor(style.color, 0.6), 1);
    graphics.beginPath();
    graphics.moveTo(topLeft.x, topLeft.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.lineTo(bottomLeftThick.x, bottomLeftThick.y);
    graphics.lineTo(topLeftThick.x, topLeftThick.y);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(this.darkenColor(style.color, 0.85), 1);

    graphics.beginPath();
    graphics.moveTo(bottom.x, bottom.y);
    graphics.lineTo(top.x, top.y);
    graphics.lineTo(topLeft.x, topLeft.y);
    graphics.lineTo(bottomLeft.x, bottomLeft.y);
    graphics.closePath();
    graphics.fillPath();
  }
}
