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
  '101': { id: '101', color: 0xEb7bac8, borderColor: 0xa89985, pattern: 'paneled' },
  '102': { id: '102', color: 0x6b7d8f, borderColor: 0x4a5a6a, pattern: 'paneled' },
  '103': { id: '103', color: 0xf4e4d4, borderColor: 0xc9b99a, pattern: 'striped' },
};

export class WallRenderer {
  private wallThickness: number = 8;
  private floorThickness: number = 8;
  private baseWallHeight: number = 115;
  private maxHeight: number = 0;

  constructor(_scene: Phaser.Scene) {}

  public setWallType(_wallType: string): void {}

  public setMaxHeight(maxHeight: number): void {
    this.maxHeight = maxHeight;
  }

  public setWallHeight(wallHeight: number): void {
    this.baseWallHeight = wallHeight * 32;
  }

  public setWallThickness(thickness: number): void {
    this.wallThickness = thickness * 8;
  }

  public setFloorThickness(thickness: number): void {
    this.floorThickness = thickness * 8;
  }

  public renderWalls(
    graphics: Phaser.GameObjects.Graphics,
    wallMeshes: WallMesh[]
  ): void {
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
        faceColors: {
          [CubeFace.TOP]: {
            fill: 0x71737c
          },
          [CubeFace.LEFT]: {
            fill: 0xb7bac8
          },
          [CubeFace.RIGHT]: {
            fill: 0x9295a0
          }
        },
        screenPosition: screenPos
      });

    }
  }

  public renderDoorFrame(
    graphics: Phaser.GameObjects.Graphics,
    doorX: number,
    doorY: number,
    doorZ: number
  ): void {
    const doorHeight = 80;
    const frameWidth = 8;

    const tileBase = {
      x: 32 * (doorX + 1) - 32 * doorY,
      y: 16 * (doorX + 1) + 16 * doorY - 32 * doorZ
    };

    const westCorner = { x: tileBase.x, y: tileBase.y };
    const northCorner = { x: tileBase.x + 32, y: tileBase.y - 16 };

    graphics.fillStyle(0xb7bac8);

    graphics.fillRect(
      westCorner.x - frameWidth / 2,
      westCorner.y - doorHeight,
      frameWidth,
      doorHeight
    );

    graphics.fillRect(
      northCorner.x - frameWidth / 2,
      northCorner.y - doorHeight,
      frameWidth,
      doorHeight
    );
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
