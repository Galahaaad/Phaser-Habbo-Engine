import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { CubeRenderer } from '@engine/CubeRenderer';
import { TileMesh, CubeFace } from '@data/types/MeshData';

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
  private floorThickness: number = 8;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public setFloorType(floorType: string): void {
    this.currentFloorType = floorType;
  }

  public renderFloor(
    graphics: Phaser.GameObjects.Graphics,
    tileMeshes: TileMesh[],
    doorTile?: { x: number; y: number }
  ): void {
    const style = FLOOR_STYLES[this.currentFloorType] || FLOOR_STYLES['101'];

    for (const mesh of tileMeshes) {
      const isDoorTile = doorTile &&
        doorTile.x >= mesh.position.x &&
        doorTile.x < mesh.position.x + mesh.size.x &&
        doorTile.y >= mesh.position.y &&
        doorTile.y < mesh.position.y + mesh.size.y;

      const isAlternate = this.shouldUseAlternateColor(mesh.position.x, mesh.position.y, style.pattern);
      const color = isDoorTile ? 0xff0000 : (isAlternate ? style.color2 : style.color1);

      const thicknessTiles = this.floorThickness / IsometricEngine.TILE_SCALE;

      const floorScreenPos = {
        x: 32 * mesh.position.x - 32 * (mesh.position.y + mesh.size.y - 1),
        y: 16 * mesh.position.x + 16 * (mesh.position.y + mesh.size.y - 1) - 32 * mesh.position.z
      };

      CubeRenderer.renderCube(graphics, {
        position: mesh.position,
        size: {
          x: mesh.size.x,
          y: mesh.size.y,
          z: thicknessTiles
        },
        color,
        shadowMultipliers: {
          [CubeFace.TOP]: 1.0,
          [CubeFace.LEFT]: 0.7,
          [CubeFace.RIGHT]: 0.6
        },
        screenPosition: floorScreenPos
      });
    }
  }

  private shouldUseAlternateColor(x: number, y: number, pattern: string): boolean {
    switch (pattern) {
      case 'checkered':
        return (x + y) % 2 === 0;
      case 'striped':
        return x % 2 === 0;
      case 'dotted':
        return false;
      default:
        return false;
    }
  }
}
