import Phaser from 'phaser';

export class DoorRenderer {
  private scene: Phaser.Scene;
  private doorGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public renderDoor(doorX: number, doorY: number, doorZ: number): void {
    if (this.doorGraphics) {
      this.doorGraphics.destroy();
    }

    const doorHeight = 92;

    const tileBase = {
      x: 32 * (doorX + 1) - 32 * doorY,
      y: 16 * (doorX + 1) + 16 * doorY - 32 * doorZ
    };

    const westCorner = { x: tileBase.x, y: tileBase.y };
    const northCorner = { x: tileBase.x + 32, y: tileBase.y - 16 };

    const bottomLeft = westCorner;
    const bottomRight = northCorner;
    const topLeft = { x: westCorner.x, y: westCorner.y - doorHeight };
    const topRight = { x: northCorner.x, y: northCorner.y - doorHeight };

    this.doorGraphics = this.scene.add.graphics();
    this.doorGraphics.fillStyle(0x000000, 1.0);
    this.doorGraphics.beginPath();
    this.doorGraphics.moveTo(topLeft.x, topLeft.y);
    this.doorGraphics.lineTo(topRight.x, topRight.y);
    this.doorGraphics.lineTo(bottomRight.x, bottomRight.y);
    this.doorGraphics.lineTo(bottomLeft.x, bottomLeft.y);
    this.doorGraphics.closePath();
    this.doorGraphics.fillPath();
    this.doorGraphics.setDepth(500);
  }

  public destroy(): void {
    if (this.doorGraphics) {
      this.doorGraphics.destroy();
    }
  }
}
