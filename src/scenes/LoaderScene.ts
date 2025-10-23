import Phaser from 'phaser';
import { AssetLoader } from '@systems/AssetLoader';

export class LoaderScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'LoaderScene' });
  }

  public init(): void {
    console.log('[LoaderScene] Initializing asset loading...');
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
    this.load.on('complete', this.onLoadComplete, this);

    this.simulateLoading();
  }

  private simulateLoading(): void {
    console.log('[LoaderScene] Loading Habbo assets...');

    AssetLoader.loadFurniture(this, 'SF_chair_blue', 'chair_blue');
    AssetLoader.loadFurniture(this, 'SF_chair_red', 'chair_red');
    AssetLoader.loadFurniture(this, 'CF_10_coin_gold', 'coin_gold');

    this.load.image('avatar_body_texture', '/assets/habbo/figure/hh_human_body/hh_human_body.png');
    this.load.json('avatar_body_meta', '/assets/habbo/figure/hh_human_body/hh_human_body.json');
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
    console.log(`[LoaderScene] Loaded: ${file.key}`);
  }

  private onLoadComplete(): void {
    console.log('[LoaderScene] All assets loaded');

    this.loadingText.destroy();
    this.progressBar.destroy();
    this.progressBox.destroy();

    this.time.delayedCall(500, () => {
      this.scene.start('RoomScene');
    });
  }

  public create(): void {}
}