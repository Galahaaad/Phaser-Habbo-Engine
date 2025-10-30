import Phaser from 'phaser';
import { type RoomData, type Tile, IsometricEngine } from '@polaris/renderer';
import { FloorAction } from '../ui/components/floorplan-editor/FloorplanEditor/FloorplanEditor';

export interface FloorplanConfig {
  currentAction: FloorAction;
  currentHeight: number;
  doorDirection: number;
}

export class FloorplanScene extends Phaser.Scene {
  private roomData: RoomData;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private config: FloorplanConfig;
  private doorTile: { x: number; y: number } | null = null;
  private offsetX: number = 450;
  private offsetY: number = 150;
  private isHolding: boolean = false;
  private lastUsedTile: { x: number; y: number } = { x: -1, y: -1 };
  private heightTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'FloorplanScene' });
    this.roomData = this.createEmptyRoom();
    this.config = {
      currentAction: FloorAction.SET,
      currentHeight: 0,
      doorDirection: 2
    };
  }

  create(): void {
    this.gridGraphics = this.add.graphics();
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.renderGrid();
  }

  private createEmptyRoom(): RoomData {
    const MAX_TILES = 64;
    const tiles: Tile[][] = [];

    for (let y = 0; y < MAX_TILES; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAX_TILES; x++) {
        tiles[y][x] = {
          x,
          y,
          height: 0,
          isBlocked: false,
          walkable: false
        };
      }
    }

    return {
      id: 1,
      name: 'Floorplan Editor',
      minX: 0,
      maxX: MAX_TILES - 1,
      minY: 0,
      maxY: MAX_TILES - 1,
      maxHeight: 0,
      wallType: '101',
      floorType: '101',
      doorTile: undefined,
      tiles,
      furniture: [],
      avatars: []
    };
  }

  public loadFromRoomData(sourceRoom: RoomData): void {
    const MAX_TILES = 64;

    for (let y = 0; y < MAX_TILES; y++) {
      for (let x = 0; x < MAX_TILES; x++) {
        if (y <= sourceRoom.maxY && x <= sourceRoom.maxX) {
          const sourceTile = sourceRoom.tiles[y][x];
          this.roomData.tiles[y][x] = {
            x,
            y,
            height: sourceTile.height,
            isBlocked: sourceTile.isBlocked,
            walkable: sourceTile.walkable
          };
        } else {
          this.roomData.tiles[y][x] = {
            x,
            y,
            height: 0,
            isBlocked: false,
            walkable: false
          };
        }
      }
    }

    if (sourceRoom.doorTile) {
      this.roomData.doorTile = { ...sourceRoom.doorTile };
    }

    this.renderGrid();
  }

  private renderGrid(): void {
    this.gridGraphics.clear();

    this.heightTexts.forEach(text => text.destroy());
    this.heightTexts = [];

    for (let y = 0; y <= this.roomData.maxY; y++) {
      for (let x = 0; x <= this.roomData.maxX; x++) {
        const tile = this.roomData.tiles[y][x];
        const screenPos = IsometricEngine.tileToScreen(x, y, 0);
        const screenX = this.offsetX + screenPos.x;
        const screenY = this.offsetY + screenPos.y;

        if (!tile.walkable) {
          this.gridGraphics.lineStyle(1, 0x404040, 0.5);
          this.gridGraphics.beginPath();
          this.gridGraphics.moveTo(screenX, screenY);
          this.gridGraphics.lineTo(screenX + 32, screenY + 16);
          this.gridGraphics.lineTo(screenX, screenY + 32);
          this.gridGraphics.lineTo(screenX - 32, screenY + 16);
          this.gridGraphics.closePath();
          this.gridGraphics.strokePath();
        }
      }
    }

    for (let y = 0; y <= this.roomData.maxY; y++) {
      for (let x = 0; x <= this.roomData.maxX; x++) {
        const tile = this.roomData.tiles[y][x];
        const screenPos = IsometricEngine.tileToScreen(x, y, 0);
        const screenX = this.offsetX + screenPos.x;
        const screenY = this.offsetY + screenPos.y;

        if (tile.walkable) {
          const heightColor = this.getHeightColor(tile.height);
          this.drawIsometricTile(screenX, screenY, heightColor, tile.height);

          if (tile.height > 0) {
            const text = this.add.text(
              screenX,
              screenY + 16,
              tile.height.toString(),
              {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Ubuntu',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
              }
            );
            text.setOrigin(0.5, 0.5);
            this.heightTexts.push(text);
          }

          if (
            this.roomData.doorTile &&
            this.roomData.doorTile.x === x &&
            this.roomData.doorTile.y === y
          ) {
            this.gridGraphics.lineStyle(4, 0x00ff00, 1);
            this.drawIsometricTileOutline(screenX, screenY);
          }
        }
      }
    }
  }

  private drawIsometricTile(x: number, y: number, color: number, height: number): void {
    this.gridGraphics.fillStyle(color, 1);
    this.gridGraphics.lineStyle(1, 0x3f4147, 1);

    this.gridGraphics.beginPath();
    this.gridGraphics.moveTo(x, y);
    this.gridGraphics.lineTo(x + 32, y + 16);
    this.gridGraphics.lineTo(x, y + 32);
    this.gridGraphics.lineTo(x - 32, y + 16);
    this.gridGraphics.closePath();
    this.gridGraphics.fillPath();
    this.gridGraphics.strokePath();
  }

  private drawIsometricTileOutline(x: number, y: number): void {
    this.gridGraphics.beginPath();
    this.gridGraphics.moveTo(x, y);
    this.gridGraphics.lineTo(x + 32, y + 16);
    this.gridGraphics.lineTo(x, y + 32);
    this.gridGraphics.lineTo(x - 32, y + 16);
    this.gridGraphics.closePath();
    this.gridGraphics.strokePath();
  }

  private getHeightColor(height: number): number {
    const colors = [
      0x0065ff,
      0x00bcff,
      0x00ff93,
      0xf2ff00,
      0xff8900,
      0xff0700,
      0xff00a5,
      0xaa00ff
    ];
    return colors[Math.min(height, colors.length - 1)];
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.isHolding = true;
    this.processTileAction(pointer);
  }

  private handlePointerUp(): void {
    this.isHolding = false;
    this.lastUsedTile = { x: -1, y: -1 };
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isHolding) return;
    this.processTileAction(pointer);
  }

  private processTileAction(pointer: Phaser.Input.Pointer): void {
    const screenX = pointer.x - this.offsetX;
    const screenY = pointer.y - this.offsetY;

    const localX = Math.floor(screenX / 64 + screenY / 32);
    const localY = Math.floor(screenY / 32 - screenX / 64);

    let gridX = localX;
    let gridY = localY;

    gridX = Math.max(0, Math.min(gridX, this.roomData.maxX));
    gridY = Math.max(0, Math.min(gridY, this.roomData.maxY));

    if (this.lastUsedTile.x === gridX && this.lastUsedTile.y === gridY) {
      return;
    }

    this.lastUsedTile = { x: gridX, y: gridY };
    this.onClick(gridX, gridY);
  }

  private onClick(gridX: number, gridY: number): void {
    const tile = this.roomData.tiles[gridY][gridX];

    switch (this.config.currentAction) {
      case FloorAction.SET:
        tile.walkable = true;
        tile.height = this.config.currentHeight;
        break;

      case FloorAction.UNSET:
        tile.walkable = false;
        tile.height = 0;
        break;

      case FloorAction.UP:
        if (tile.walkable && tile.height < 9) {
          tile.height++;
        }
        break;

      case FloorAction.DOWN:
        if (tile.walkable && tile.height > 0) {
          tile.height--;
        }
        break;

      case FloorAction.DOOR:
        if (tile.walkable) {
          this.roomData.doorTile = { x: gridX, y: gridY };
          this.doorTile = { x: gridX, y: gridY };
        }
        break;
    }

    this.renderGrid();
  }

  public updateConfig(config: Partial<FloorplanConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getRoomData(): RoomData {
    return this.roomData;
  }

  public loadRoomData(data: RoomData): void {
    this.roomData = data;
    this.renderGrid();
  }

  public exportPattern(): string[] {
    const pattern: string[] = [];
    let maxY = 0;
    let maxX = 0;

    for (let y = 0; y < this.roomData.tiles.length; y++) {
      for (let x = 0; x < this.roomData.tiles[y].length; x++) {
        if (this.roomData.tiles[y][x].walkable) {
          maxY = Math.max(maxY, y);
          maxX = Math.max(maxX, x);
        }
      }
    }

    for (let y = 0; y <= maxY; y++) {
      let row = '';
      for (let x = 0; x <= maxX; x++) {
        const tile = this.roomData.tiles[y][x];
        if (tile.walkable) {
          row += tile.height.toString(36);
        } else {
          row += 'x';
        }
      }
      pattern.push(row);
    }
    return pattern;
  }
}
