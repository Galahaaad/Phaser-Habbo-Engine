import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public init(): void {
    this.setupGlobalSettings();
  }

  private setupGlobalSettings(): void {
    this.input.mouse?.disableContextMenu();
    this.cameras.main.setBackgroundColor('#2d2d2d');
  }

  public preload(): void {}

  public create(): void {
    this.scene.start('LoaderScene');
  }
}