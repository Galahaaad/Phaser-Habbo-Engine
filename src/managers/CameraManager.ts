import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';

export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.setupCameraControls();
  }

  private setupCameraControls(): void {
    this.scene.input.on('wheel', this.handleZoom, this);
    this.scene.input.on('pointermove', this.handlePan, this);
  }

  private handleZoom(_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number): void {
    const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomAmount, 0.5, 2);
    this.camera.setZoom(newZoom);
  }

  private handlePan(pointer: Phaser.Input.Pointer): void {
    if (!pointer.leftButtonDown()) return;

    const deltaX = pointer.x - pointer.prevPosition.x;
    const deltaY = pointer.y - pointer.prevPosition.y;

    this.camera.scrollX -= deltaX / this.camera.zoom;
    this.camera.scrollY -= deltaY / this.camera.zoom;
  }

  public centerOn(tileX: number, tileY: number, tileZ: number = 0): void {
    const screenPos = IsometricEngine.tileToScreen(tileX, tileY, tileZ);
    this.camera.centerOn(screenPos.x, screenPos.y);
  }

  public setZoom(zoom: number): void {
    this.camera.setZoom(Phaser.Math.Clamp(zoom, 0.5, 2));
  }

  public getZoom(): number {
    return this.camera.zoom;
  }

  public getScrollPosition(): { x: number; y: number } {
    return {
      x: this.camera.scrollX,
      y: this.camera.scrollY
    };
  }

  public setBackgroundColor(color: string): void {
    this.camera.setBackgroundColor(color);
  }

  public destroy(): void {
    this.scene.input.off('wheel', this.handleZoom, this);
    this.scene.input.off('pointermove', this.handlePan, this);
  }
}
