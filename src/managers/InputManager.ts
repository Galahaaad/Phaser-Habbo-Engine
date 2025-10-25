import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { RoomManager } from './RoomManager';

export interface TilePosition {
  x: number;
  y: number;
}

export class InputManager {
  private scene: Phaser.Scene;
  private roomManager: RoomManager;
  private currentHoverTile: TilePosition | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  private onTileClickCallback?: (tile: TilePosition) => void;
  private onTileHoverCallback?: (tile: TilePosition | null) => void;

  constructor(scene: Phaser.Scene, roomManager: RoomManager) {
    this.scene = scene;
    this.roomManager = roomManager;
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown()) {
      this.isDragging = true;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const dragDistance = Math.sqrt(
      Math.pow(pointer.x - this.dragStartX, 2) +
      Math.pow(pointer.y - this.dragStartY, 2)
    );

    if (dragDistance < 5 && pointer.leftButtonReleased()) {
      this.handleTileClick(pointer);
    }

    this.isDragging = false;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) {
      return;
    }

    this.updateHoverTile(pointer);
  }

  private handleTileClick(pointer: Phaser.Input.Pointer): void {
    const tile = this.getTileAtScreenPosition(pointer.worldX, pointer.worldY);

    if (tile && this.onTileClickCallback) {
      this.onTileClickCallback(tile);
    }
  }

  private updateHoverTile(pointer: Phaser.Input.Pointer): void {
    const hoveredTile = this.getTileAtScreenPosition(pointer.worldX, pointer.worldY);

    if (hoveredTile && (!this.currentHoverTile || hoveredTile.x !== this.currentHoverTile.x || hoveredTile.y !== this.currentHoverTile.y)) {
      this.currentHoverTile = hoveredTile;
      if (this.onTileHoverCallback) {
        this.onTileHoverCallback(hoveredTile);
      }
    } else if (!hoveredTile && this.currentHoverTile) {
      this.currentHoverTile = null;
      if (this.onTileHoverCallback) {
        this.onTileHoverCallback(null);
      }
    }
  }

  public getTileAtScreenPosition(worldX: number, worldY: number): TilePosition | null {
    const roomData = this.roomManager.getRoomData();

    for (let testY = roomData.maxY; testY >= 0; testY--) {
      for (let testX = roomData.maxX; testX >= 0; testX--) {
        const tile = this.roomManager.getTile(testX, testY);
        if (!tile || !tile.walkable) continue;

        const tileScreen = IsometricEngine.tileToScreen(testX, testY, tile.height);
        const centerX = tileScreen.x + 32;
        const centerY = tileScreen.y;

        const dx = worldX - centerX;
        const dy = worldY - centerY;
        const diamondDist = Math.abs(dx / 32) + Math.abs(dy / 16);

        if (diamondDist <= 1.05) {
          return { x: testX, y: testY };
        }
      }
    }

    return null;
  }

  public update(): void {
    const pointer = this.scene.input.activePointer;
    this.updateHoverTile(pointer);
  }

  public onTileClick(callback: (tile: TilePosition) => void): void {
    this.onTileClickCallback = callback;
  }

  public onTileHover(callback: (tile: TilePosition | null) => void): void {
    this.onTileHoverCallback = callback;
  }

  public isDraggingCamera(): boolean {
    return this.isDragging;
  }

  public getDragStart(): { x: number; y: number } {
    return { x: this.dragStartX, y: this.dragStartY };
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
  }
}
