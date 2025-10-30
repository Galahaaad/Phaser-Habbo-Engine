import Phaser from 'phaser';
import { Vector3 } from '../data/types/Vector3';
import { IsometricEngine } from '../engine/IsometricEngine';

export class HabboAvatarSprite {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bodySprite!: Phaser.GameObjects.Sprite;
  private headSprite!: Phaser.GameObjects.Sprite;
  private leftHandSprite!: Phaser.GameObjects.Sprite;
  private rightHandSprite!: Phaser.GameObjects.Sprite;

  private position: Vector3;
  private direction: number = 2;
  private isWalking: boolean = false;

  private currentPath: Vector3[] = [];
  private currentTarget: Vector3 | null = null;

  private moveStartTime: number = 0;
  private moveDuration: number = 500;
  private moveStartPos: Vector3 = new Vector3(0, 0, 0);

  private frameCounter: number = 0;
  private frameUpdateCounter: number = 0;
  private frameUpdateInterval: number = 3;

  private username: string;
  private id: number;

  constructor(
    scene: Phaser.Scene,
    id: number,
    username: string,
    startX: number,
    startY: number,
    startZ: number = 0
  ) {
    this.scene = scene;
    this.id = id;
    this.username = username;
    this.position = new Vector3(startX, startY, startZ);

    this.container = scene.add.container(0, 0);

    this.createBodySprite();

    this.container.add([this.bodySprite, this.leftHandSprite, this.rightHandSprite, this.headSprite]);

    this.updateScreenPosition();
    this.updateSprite();
  }

  private createBodySprite(): void {
    this.bodySprite = this.scene.add.sprite(0, 0, 'avatar_body');
    this.bodySprite.setOrigin(0, 0);

    this.leftHandSprite = this.scene.add.sprite(0, 0, 'avatar_body');
    this.leftHandSprite.setOrigin(0, 0);

    this.rightHandSprite = this.scene.add.sprite(0, 0, 'avatar_body');
    this.rightHandSprite.setOrigin(0, 0);

    this.headSprite = this.scene.add.sprite(0, 0, 'avatar_body');
    this.headSprite.setOrigin(0, 0);
  }

  private updateSprite(): void {
    let actualDirection = this.direction;
    let flipped = false;

    if (this.direction === 4) {
      actualDirection = 2;
      flipped = true;
    } else if (this.direction === 5) {
      actualDirection = 1;
      flipped = true;
    } else if (this.direction === 6) {
      actualDirection = 0;
      flipped = true;
    }

    const meta = this.scene.cache.json.get('figure_hh_human_body_meta');
    const assets = meta?.assets || {};

    const parts = ['bd', 'lh', 'rh', 'hd'];
    const sprites = [this.bodySprite, this.leftHandSprite, this.rightHandSprite, this.headSprite];

    parts.forEach((part, index) => {
      const action = (part === 'hd') ? 'std' : (this.isWalking ? 'wlk' : 'std');
      const frame = (part === 'hd' || !this.isWalking) ? 0 : this.frameCounter;
      const frameName = `h_${action}_${part}_1_${actualDirection}_${frame}`;
      const sprite = sprites[index];

      try {
        if (sprite.texture.has(frameName)) {
          sprite.setFrame(frameName);
          sprite.setFlipX(flipped);
          sprite.setVisible(true);

          const assetKey = frameName;
          const assetData = assets[assetKey];

          if (assetData) {
            const frameData = sprite.frame;

            let offsetX = -assetData.x;
            let offsetY = -assetData.y;

            if (flipped) {
              offsetX = -(offsetX + frameData.width);
            }

            sprite.setPosition(offsetX, offsetY);
          } else {
            sprite.setPosition(0, 0);
          }
        } else {
          sprite.setVisible(false);
        }
      } catch (e) {
        sprite.setVisible(false);
      }
    });
  }

  public walkTo(path: Vector3[]): void {
    if (path.length === 0) return;

    if (this.isWalking) {
      this.position.set(
        Math.round(this.position.x),
        Math.round(this.position.y),
        this.position.z
      );
    }

    this.currentPath = path.map(p => new Vector3(p.x, p.y, p.z));
    this.currentTarget = this.currentPath.shift() || null;

    if (this.currentTarget) {
      this.isWalking = true;
      this.frameCounter = 0;
      this.frameUpdateCounter = 0;

      const dir = this.calculateDirection(this.position, this.currentTarget);
      this.setDirection(dir);

      this.moveStartTime = Date.now();
      this.moveStartPos = this.position.clone();
    }
  }

  public stop(): void {
    this.isWalking = false;
    this.currentPath = [];
    this.currentTarget = null;
    this.frameCounter = 0;
    this.frameUpdateCounter = 0;
    this.updateSprite();
  }

  public update(_time: number, _delta: number): void {
    if (!this.isWalking || !this.currentTarget) return;

    const now = Date.now();
    const elapsed = now - this.moveStartTime;
    const progress = Math.min(elapsed / this.moveDuration, 1);

    if (progress >= 1) {
      this.position.set(
        this.currentTarget.x,
        this.currentTarget.y,
        this.currentTarget.z
      );

      if (this.currentPath.length > 0) {
        this.currentTarget = this.currentPath.shift()!;
        const dir = this.calculateDirection(this.position, this.currentTarget);
        this.setDirection(dir);

        this.moveStartTime = now;
        this.moveStartPos = this.position.clone();
        this.frameCounter = 0;
        this.frameUpdateCounter = 0;
      } else {
        this.stop();
      }
    } else {
      this.position.x = this.moveStartPos.x + (this.currentTarget.x - this.moveStartPos.x) * progress;
      this.position.y = this.moveStartPos.y + (this.currentTarget.y - this.moveStartPos.y) * progress;
      this.position.z = this.moveStartPos.z + (this.currentTarget.z - this.moveStartPos.z) * progress;

      this.frameUpdateCounter++;
      if (this.frameUpdateCounter >= this.frameUpdateInterval) {
        this.frameUpdateCounter = 0;
        this.frameCounter = (this.frameCounter + 1) % 4;
        this.updateSprite();
      }
    }

    this.updateScreenPosition();
  }

  private calculateDirection(from: Vector3, to: Vector3): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy < 0) return 0;
    if (dx > 0 && dy < 0) return 1;
    if (dx > 0 && dy === 0) return 2;
    if (dx > 0 && dy > 0) return 3;
    if (dx === 0 && dy > 0) return 4;
    if (dx < 0 && dy > 0) return 5;
    if (dx < 0 && dy === 0) return 6;
    if (dx < 0 && dy < 0) return 7;

    return this.direction;
  }

  private setDirection(newDirection: number): void {
    if (this.direction !== newDirection) {
      this.direction = newDirection;
      this.updateSprite();
    }
  }

  private updateScreenPosition(): void {
    const baseTileCorner = IsometricEngine.tileToScreen(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      this.position.z
    );

    const fracX = this.position.x - Math.floor(this.position.x);
    const fracY = this.position.y - Math.floor(this.position.y);

    const screenPos = {
      x: baseTileCorner.x + 32 + (fracX - fracY) * 32,
      y: baseTileCorner.y + (fracX + fracY) * 16
    };

    const isFlipped = (this.direction === 4 || this.direction === 5 || this.direction === 6);
    const MANUAL_OFFSET_X = isFlipped ? 30 : -35;
    const MANUAL_OFFSET_Y = 0;

    const containerX = screenPos.x + MANUAL_OFFSET_X;
    const containerY = screenPos.y + MANUAL_OFFSET_Y;

    this.container.setPosition(containerX, containerY);
  }

  public getPosition(): Vector3 {
    return this.position;
  }

  public getTilePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y)
    };
  }

  public setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  public isMoving(): boolean {
    return this.isWalking;
  }

  public getId(): number {
    return this.id;
  }

  public getUsername(): string {
    return this.username;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
