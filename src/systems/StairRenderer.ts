import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { CubeRenderer } from '@engine/CubeRenderer';
import { StairMesh, StairDirection } from '@data/types/StairData';
import { CubeFace } from '@data/types/MeshData';

export class StairRenderer {
  // @ts-ignore
    private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public renderStairs(graphics: Phaser.GameObjects.Graphics, stairs: StairMesh[]): void {
    for (const stair of stairs) {
      this.renderStair(graphics, stair);
    }
  }

  private renderStair(graphics: Phaser.GameObjects.Graphics, stair: StairMesh): void {
    const { position, direction, corner } = stair;

    if (corner) {
      for (let i = 1; i < 4; i++) {
        if (corner === 'left') {
          this.renderStairCornerLeft(graphics, position, i);
        } else if (corner === 'right') {
          this.renderStairCornerRight(graphics, position, i);
        } else if (corner === 'front') {
          this.renderStairCornerFront(graphics, position, i);
        } else if (corner === 'back') {
          this.renderStairCornerBack(graphics, position, i);
        }
      }
    } else if (direction !== null) {
      for (let i = 1; i < 4; i++) {
        if (direction === StairDirection.NORTH) {
          this.renderStairStepNorth(graphics, position, i);
        } else if (direction === StairDirection.WEST) {
          this.renderStairStepWest(graphics, position, i);
        } else if (direction === StairDirection.SOUTH) {
          this.renderStairStepSouth(graphics, position, i);
        } else if (direction === StairDirection.EAST) {
          this.renderStairStepEast(graphics, position, i);
        }
      }
    }
  }

  private renderStairStepNorth(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + (8 * (index));
    const cubeY = tileScreen.y + (-12 * (index));

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 1, y: 0.25, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairStepWest(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + (8 * (index - 1));
    const cubeY = tileScreen.y - 24 + (12 * (index - 1));

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 0.25, y: 1, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairStepSouth(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + 24 + (-8 * (index - 1));
    const cubeY = tileScreen.y - 12 + (-4 * (index - 1));

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 1, y: 0.25, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairStepEast(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + 24 + (-8 * (index - 1));
    const cubeY = tileScreen.y - 12 + (4 * (index - 1));

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 0.25, y: 1, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairCornerLeft(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const sizeY = 1 - (0.25 * index);
    const cubeX = tileScreen.x + 24 + (-8 * index);
    const cubeY = tileScreen.y + 12 + (-12 * index);

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 0.25, y: sizeY, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairCornerRight(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + (8 * index) + (8 * index);
    const cubeY = tileScreen.y + (-12 * index) + (4 * index);

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 1 - (0.25 * index), y: 0.25, z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairCornerFront(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + (8 * index);
    const cubeY = tileScreen.y + (-12 * index);

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 1 - (0.25 * index), y: 1 - (0.25 * index), z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }

  private renderStairCornerBack(
    graphics: Phaser.GameObjects.Graphics,
    position: { x: number; y: number; z: number },
    index: number
  ): void {
    const tileScreen = IsometricEngine.tileToScreen(position.x, position.y, position.z);

    const cubeX = tileScreen.x + (8 * index);
    const cubeY = tileScreen.y + (12 * index);

    CubeRenderer.renderCube(graphics, {
      position: { x: position.x, y: position.y, z: position.z },
      size: { x: 1 - (0.25 * index), y: 1 - (0.25 * index), z: 0.25 },
      screenPosition: { x: cubeX, y: cubeY },
      faceColors: {
        [CubeFace.TOP]: { fill: 0x999966, stroke: 0x8f8f5f, strokeWidth: 1 },
        [CubeFace.LEFT]: { fill: 0x858558 },
        [CubeFace.RIGHT]: { fill: 0x70704b }
      }
    });
  }
}
