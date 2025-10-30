import Phaser from 'phaser';

export class GraphicsPool {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Graphics[] = [];
  private active: Set<Phaser.GameObjects.Graphics> = new Set();
  private initialPoolSize: number;

  constructor(scene: Phaser.Scene, initialSize: number = 5) {
    this.scene = scene;
    this.initialPoolSize = initialSize;
    this.prewarm();
  }

  private prewarm(): void {
    for (let i = 0; i < this.initialPoolSize; i++) {
      const graphics = this.scene.add.graphics();
      graphics.setVisible(false);
      this.pool.push(graphics);
    }
  }

  public acquire(): Phaser.GameObjects.Graphics {
    let graphics: Phaser.GameObjects.Graphics;

    if (this.pool.length > 0) {
      graphics = this.pool.pop()!;
    } else {
      graphics = this.scene.add.graphics();
    }

    graphics.setVisible(true);
    this.active.add(graphics);

    return graphics;
  }

  public release(graphics: Phaser.GameObjects.Graphics): void {
    if (!this.active.has(graphics)) {
      return;
    }

    graphics.clear();
    graphics.setVisible(false);
    this.active.delete(graphics);
    this.pool.push(graphics);
  }

  public releaseAll(): void {
    this.active.forEach(graphics => {
      graphics.clear();
      graphics.setVisible(false);
      this.pool.push(graphics);
    });
    this.active.clear();
  }

  public getActiveCount(): number {
    return this.active.size;
  }

  public getPoolSize(): number {
    return this.pool.length;
  }

  public destroy(): void {
    this.active.forEach(g => g.destroy());
    this.pool.forEach(g => g.destroy());
    this.active.clear();
    this.pool = [];
  }
}
