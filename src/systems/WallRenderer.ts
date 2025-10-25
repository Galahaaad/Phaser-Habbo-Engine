import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { CubeRenderer } from '@engine/CubeRenderer';
import { WallMesh, CubeFace } from '@data/types/MeshData';

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
  private wallThickness: number = 8;
  private floorThickness: number = 8;
  private baseWallHeight: number = 115;
  private maxHeight: number = 0;
  // @ts-ignore
    private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public setWallType(wallType: string): void {
    this.currentWallType = wallType;
  }

  public setMaxHeight(maxHeight: number): void {
    this.maxHeight = maxHeight;
  }

  public renderWalls(
    graphics: Phaser.GameObjects.Graphics,
    wallMeshes: WallMesh[]
  ): void {
    const style = WALL_STYLES[this.currentWallType] || WALL_STYLES['101'];
    const thicknessTiles = this.wallThickness / IsometricEngine.TILE_SCALE;

    const sortedWalls = [...wallMeshes].sort((a, b) => {
      if (a.direction !== b.direction) {
        return a.direction === 'west' ? -1 : 1;
      }
      const depthA = IsometricEngine.calculateWallDepth(a.position.x, a.position.y, 6);
      const depthB = IsometricEngine.calculateWallDepth(b.position.x, b.position.y, 6);
      return depthA - depthB;
    });

    for (const mesh of sortedWalls) {
      let sizeX: number, sizeY: number;

      if (mesh.direction === 'west') {
        sizeX = thicknessTiles;
        sizeY = mesh.length + (mesh.corner ? thicknessTiles : 0);
      } else {
        sizeX = mesh.length;
        sizeY = thicknessTiles;
      }

      const wallHeightTiles = this.floorThickness / 32 - mesh.position.z + this.baseWallHeight / 32 + this.maxHeight;

      const screenPos = this.calculateWallPosition(
        mesh.position,
        { x: sizeX, y: sizeY, z: wallHeightTiles },
        mesh.direction,
        mesh.length
      );

      CubeRenderer.renderCube(graphics, {
        position: mesh.position,
        size: { x: sizeX, y: sizeY, z: wallHeightTiles },
        color: style.color,
        shadowMultipliers: {
          [CubeFace.TOP]: 1.0,
          [CubeFace.LEFT]: 0.8,
          [CubeFace.RIGHT]: 0.71
        },
        screenPosition: screenPos
      });

    }
  }

  private calculateWallPosition(
    position: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    direction: string,
    length: number
  ): { x: number; y: number } {
    let result: { x: number; y: number };

    if (direction === 'west') {
      result = {
        x: 32 * (position.x - (position.y + length - 1)) - this.wallThickness,
        y: 16 * position.x + 16 * (position.y + length - 1) - 32 * (position.z + size.z) - this.floorThickness / 2
      };
    } else {
      result = {
        x: 32 * position.x - 32 * (position.y - 1),
        y: 16 * position.x + 16 * (position.y - 1) - 32 * (position.z + size.z)
      };
    }

    return result;
  }
}
