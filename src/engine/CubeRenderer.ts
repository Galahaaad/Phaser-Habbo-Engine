import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { Vector3D, CubeFace } from '@data/types/MeshData';

export interface FaceColors {
  fill: number;
  stroke?: number;
  strokeWidth?: number;
}

export interface CubeOptions {
  position: Vector3D;
  size: Vector3D;
  color?: number;
  faceColors?: {
    [CubeFace.TOP]?: FaceColors;
    [CubeFace.LEFT]?: FaceColors;
    [CubeFace.RIGHT]?: FaceColors;
  };
  shadowMultipliers?: {
    [CubeFace.TOP]?: number;
    [CubeFace.LEFT]?: number;
    [CubeFace.RIGHT]?: number;
  };
  screenPosition?: { x: number; y: number };
  scene?: Phaser.Scene;
  container?: Phaser.GameObjects.Container;
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
    const { position, size, color, faceColors } = options;
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

    const topFace = faceColors?.[CubeFace.TOP];
    const topColor = topFace?.fill ?? (color ? this.darkenColor(color, shadowMultipliers[CubeFace.TOP]!) : 0xffffff);

    graphics.fillStyle(topColor, 1);
    if (topFace?.stroke) {
      graphics.lineStyle(topFace.strokeWidth || 1, topFace.stroke, 1);
    }
    graphics.beginPath();
    graphics.moveTo(basePos.x + 0, basePos.y + 0);
    graphics.lineTo(basePos.x + 32 * size.y, basePos.y - 16 * size.y);
    graphics.lineTo(
      basePos.x + 32 * (size.x + 1) + 32 * (size.y - 1),
      basePos.y - 16 * (size.y - 1) + 16 * (size.x - 1)
    );
    graphics.lineTo(basePos.x + 32 * size.x, basePos.y + 16 * size.x);
    graphics.closePath();
    graphics.fillPath();
    if (topFace?.stroke) {
      graphics.strokePath();
      graphics.lineStyle(0, 0xffffff, 0);
    }

    const leftFace = faceColors?.[CubeFace.LEFT];
    const leftColor = leftFace?.fill ?? (color ? this.darkenColor(color, shadowMultipliers[CubeFace.LEFT]!) : 0xffffff);

    graphics.fillStyle(leftColor, 1);
    if (leftFace?.stroke) {
      graphics.lineStyle(leftFace.strokeWidth || 1, leftFace.stroke, 1);
    }
    graphics.beginPath();
    graphics.moveTo(basePos.x + 0, basePos.y + 0);
    graphics.lineTo(basePos.x + 0, basePos.y + size.z * 32);
    graphics.lineTo(basePos.x + 32 * size.x, basePos.y + 16 * size.x + size.z * 32);
    graphics.lineTo(basePos.x + 32 * size.x, basePos.y + 16 * size.x);
    graphics.closePath();
    graphics.fillPath();
    if (leftFace?.stroke) {
      graphics.strokePath();
      graphics.lineStyle(0, 0xffffff, 0);
    }

    const rightFace = faceColors?.[CubeFace.RIGHT];
    const rightColor = rightFace?.fill ?? (color ? this.darkenColor(color, shadowMultipliers[CubeFace.RIGHT]!) : 0xffffff);

    graphics.fillStyle(rightColor, 1);
    if (rightFace?.stroke) {
      graphics.lineStyle(rightFace.strokeWidth || 1, rightFace.stroke, 1);
    }
    graphics.beginPath();
    graphics.moveTo(basePos.x + 32 * size.x, basePos.y + 16 * size.x);
    graphics.lineTo(basePos.x + 32 * size.x, basePos.y + 16 * size.x + size.z * 32);
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
    if (rightFace?.stroke) {
      graphics.strokePath();
      graphics.lineStyle(0, 0xffffff, 0);
    }
  }
}
