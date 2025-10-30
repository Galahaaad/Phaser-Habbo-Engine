import Phaser from 'phaser';
import { IsometricEngine } from '../engine/IsometricEngine';

export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.camera.setZoom(1.0);
    this.setupCameraControls();
  }

  private setupCameraControls(): void {
    this.scene.input.on('pointermove', this.handlePan, this);
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.leftButtonDown()) {
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.isDragging = false;
    }
  }

  private handlePan(pointer: Phaser.Input.Pointer): void {
    if (!pointer.leftButtonDown() && !pointer.middleButtonDown()) return;

    if (pointer.leftButtonDown() && !this.isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(pointer.x - this.dragStartX, 2) +
        Math.pow(pointer.y - this.dragStartY, 2)
      );

      if (dragDistance < 5) {
        return;
      }

      this.isDragging = true;
    }

    const deltaX = pointer.x - pointer.prevPosition.x;
    const deltaY = pointer.y - pointer.prevPosition.y;

    this.camera.scrollX -= deltaX;
    this.camera.scrollY -= deltaY;
  }

  public centerOn(tileX: number, tileY: number, tileZ: number = 0): void {
    const screenPos = IsometricEngine.tileToScreen(tileX, tileY, tileZ);
    this.camera.centerOn(screenPos.x, screenPos.y);
  }

  public getScrollPosition(): { x: number; y: number } {
    return {
      x: this.camera.scrollX,
      y: this.camera.scrollY
    };
  }

  public isPositionVisible(screenX: number, screenY: number, margin: number = 100): boolean {
    const cameraLeft = this.camera.scrollX;
    const cameraRight = cameraLeft + this.camera.width;
    const cameraTop = this.camera.scrollY;
    const cameraBottom = cameraTop + this.camera.height;

    return (
      screenX >= cameraLeft + margin &&
      screenX <= cameraRight - margin &&
      screenY >= cameraTop + margin &&
      screenY <= cameraBottom - margin
    );
  }

  public isRectangleVisible(rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
    const cameraLeft = this.camera.scrollX;
    const cameraRight = cameraLeft + this.camera.width;
    const cameraTop = this.camera.scrollY;
    const cameraBottom = cameraTop + this.camera.height;

    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;

    return !(
      rectRight < cameraLeft ||
      rectX > cameraRight ||
      rectBottom < cameraTop ||
      rectY > cameraBottom
    );
  }

  public smoothCenterOn(screenX: number, screenY: number, duration: number = 500): void {
    const targetScrollX = screenX - this.camera.width / 2;
    const targetScrollY = screenY - this.camera.height / 2;

    this.scene.tweens.add({
      targets: this.camera,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      duration: duration,
      ease: 'Cubic.easeInOut'
    });
  }

  public setBackgroundColor(color: string): void {
    this.camera.setBackgroundColor(color);
  }

  public destroy(): void {
    this.scene.input.off('pointermove', this.handlePan, this);
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
  }
}
