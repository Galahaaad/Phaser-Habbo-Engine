import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { Vector3D, CubeFace } from '@data/types/MeshData';

export interface CubeOptions {
  position: Vector3D;
  size: Vector3D;
  color: number;
  shadowMultipliers?: {
    [CubeFace.TOP]?: number;
    [CubeFace.LEFT]?: number;
    [CubeFace.RIGHT]?: number;
  };
  screenPosition?: { x: number; y: number };
}

export class CubeRenderer {
  private static darkenColor(color: number, factor: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    return (
      (Math.floor(r * factor) << 16) |
      (Math.floor(g * factor) << 8) |
      Math.floor(b * factor)
    );
  }

  public static renderCube(
    graphics: Phaser.GameObjects.Graphics,
    options: CubeOptions
  ): void {
    const { position, size, color } = options;
    const shadowMultipliers = options.shadowMultipliers || {
      [CubeFace.TOP]: 1.0,
      [CubeFace.LEFT]: 0.8,
      [CubeFace.RIGHT]: 0.71
    };

    const basePos = options.screenPosition || IsometricEngine.tileToScreenWithSize(
      position.x,
      position.y,
      position.z,
      size.x,
      size.y
    );


    graphics.fillStyle(
      this.darkenColor(color, shadowMultipliers[CubeFace.TOP]!),
      1
    );
    graphics.beginPath();
    graphics.moveTo(
      basePos.x + 0,
      basePos.y + 0
    );
    graphics.lineTo(
      basePos.x + 32 * size.y,
      basePos.y - 16 * size.y
    );
    graphics.lineTo(
      basePos.x + 32 * (size.x + 1) + 32 * (size.y - 1),
      basePos.y - 16 * (size.y - 1) + 16 * (size.x - 1)
    );
    graphics.lineTo(
      basePos.x + 32 * size.x,
      basePos.y + 16 * size.x
    );
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(
      this.darkenColor(color, shadowMultipliers[CubeFace.LEFT]!),
      1
    );
    graphics.beginPath();
    graphics.moveTo(
      basePos.x + 0,
      basePos.y + 0
    );
    graphics.lineTo(
      basePos.x + 0,
      basePos.y + size.z * 32
    );
    graphics.lineTo(
      basePos.x + 32 * size.x,
      basePos.y + 16 * size.x + size.z * 32
    );
    graphics.lineTo(
      basePos.x + 32 * size.x,
      basePos.y + 16 * size.x
    );
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(
      this.darkenColor(color, shadowMultipliers[CubeFace.RIGHT]!),
      1
    );
    graphics.beginPath();
    graphics.moveTo(
      basePos.x + 32 * size.x,
      basePos.y + 16 * size.x
    );
    graphics.lineTo(
      basePos.x + 32 * size.x,
      basePos.y + 16 * size.x + size.z * 32
    );
    graphics.lineTo(
      basePos.x + 32 * (size.x + 1) + 32 * (size.y - 1),
      basePos.y - 16 * (size.y - 1) + 16 * (size.x - 1) + size.z * 32
    );
    graphics.lineTo(
      basePos.x + 32 * (size.x + 1) + 32 * (size.y - 1),
      basePos.y - 16 * (size.y - 1) + 16 * (size.x - 1)
    );
    graphics.closePath();
    graphics.fillPath();
  }
}
