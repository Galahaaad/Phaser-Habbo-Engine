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
  '101': { id: '101', color1: 0x999966, color2: 0x999966, pattern: 'solid' },
  '102': { id: '102', color1: 0x4a4a4a, color2: 0x5a5a5a, pattern: 'checkered' },
  '103': { id: '103', color1: 0xc8b896, color2: 0xdbc9a6, pattern: 'striped' },
  '104': { id: '104', color1: 0x7c9eb2, color2: 0x8fadc0, pattern: 'checkered' },
};

export class FloorRenderer {
  private floorThickness: number = 8;

  constructor(_scene: Phaser.Scene) {}

  public setFloorType(_floorType: string): void {}

  public renderFloor(
    graphics: Phaser.GameObjects.Graphics,
    tileMeshes: TileMesh[],
    _doorTile?: { x: number; y: number },
    stairTilePositions?: Set<string>
  ): void {

    for (const mesh of tileMeshes) {
      if (stairTilePositions) {
        let hasStair = false;
        for (let dy = 0; dy < mesh.size.y; dy++) {
          for (let dx = 0; dx < mesh.size.x; dx++) {
            const tileX = mesh.position.x + dx;
            const tileY = mesh.position.y + dy;
            if (stairTilePositions.has(`${tileX},${tileY}`)) {
              hasStair = true;
              break;
            }
          }
          if (hasStair) break;
        }

        if (hasStair) {
          for (let dy = 0; dy < mesh.size.y; dy++) {
            for (let dx = 0; dx < mesh.size.x; dx++) {
              const tileX = mesh.position.x + dx;
              const tileY = mesh.position.y + dy;

              if (stairTilePositions.has(`${tileX},${tileY}`)) {
                continue;
              }

              const thicknessTiles = this.floorThickness / IsometricEngine.TILE_SCALE;
              const floorScreenPos = {
                x: 32 * tileX - 32 * tileY,
                y: 16 * tileX + 16 * tileY - 32 * mesh.position.z
              };

              CubeRenderer.renderCube(graphics, {
                position: { x: tileX, y: tileY, z: mesh.position.z },
                size: { x: 1, y: 1, z: thicknessTiles },
                faceColors: {
                  [CubeFace.TOP]: { fill: 0x999966 },
                  [CubeFace.LEFT]: { fill: 0x858558 },
                  [CubeFace.RIGHT]: { fill: 0x70704b }
                },
                screenPosition: floorScreenPos
              });
            }
          }
          continue;
        }
      }

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
        faceColors: {
          [CubeFace.TOP]: {
            fill: 0x999966
          },
          [CubeFace.LEFT]: {
            fill: 0x858558
          },
          [CubeFace.RIGHT]: {
            fill: 0x70704b
          }
        },
        screenPosition: floorScreenPos
      });
    }
  }
}
