import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public init(): void {
    console.log('[BootScene] Initializing...');
    this.setupGlobalSettings();
  }

  private setupGlobalSettings(): void {
    this.input.mouse?.disableContextMenu();
    this.cameras.main.setBackgroundColor('#2d2d2d');
    console.log('[BootScene] Global settings configured');
  }

  public preload(): void {}

  public create(): void {
    console.log('[BootScene] Boot complete, starting LoaderScene');
    this.scene.start('LoaderScene');
  }
}