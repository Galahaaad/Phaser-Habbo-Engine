import Phaser from 'phaser';
import { AssetLoader } from '@polaris/renderer';

export class LoaderScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'LoaderScene' });
  }

  public init(): void {
  }

  public preload(): void {
    const { width, height } = this.cameras.main;

    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.loadingText.setOrigin(0.5);

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 10, 320, 30);

    this.progressBar = this.add.graphics();

    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('fileprogress', this.onFileProgress, this);
  }

  public create(): void {
    this.simulateLoading();
  }

  private async simulateLoading(): Promise<void> {
    const useBundle = true;

    const loadPromises = [
      AssetLoader.loadFurniture(this, 'SF_chair_blue', useBundle),
      AssetLoader.loadFurniture(this, 'SF_chair_red', useBundle),
      AssetLoader.loadFurniture(this, 'CF_10_coin_gold', useBundle),
      AssetLoader.loadFigure(this, 'hh_human_body', useBundle)
    ];

    try {
      await Promise.all(loadPromises);
      this.onLoadComplete();
    } catch (error) {
      console.error('[LoaderScene] Failed to load assets:', error);
    }
  }

  private onLoadProgress(value: number): void {
    const { width, height } = this.cameras.main;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x00ff00, 1);
    this.progressBar.fillRect(width / 2 - 150, height / 2, 300 * value, 10);

    const percent = Math.floor(value * 100);
    this.loadingText.setText(`Loading... ${percent}%`);
  }

  private onFileProgress(file: Phaser.Loader.File): void {
  }

  private onLoadComplete(): void {
    if (this.loadingText) this.loadingText.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressBox) this.progressBox.destroy();

    this.time.delayedCall(500, () => {
      this.scene.start('RoomScene');
    });
  }
}