import Phaser from 'phaser';
import { Vector3 } from '@data/types/Vector3';
import { IsometricEngine } from '@engine/IsometricEngine';
import { DepthManager } from '@engine/DepthManager';
import { RoomObjectCategory } from '@data/types/RoomData';

export class Avatar {
  private container: Phaser.GameObjects.Container;
  private bodySprite: Phaser.GameObjects.Arc;
  private directionIndicator: Phaser.GameObjects.Triangle;
  private nameText: Phaser.GameObjects.Text;

  private position: Vector3;
  private direction: number = 4;
  private isWalking: boolean = false;

  private currentPath: Vector3[] = [];
  private currentTarget: Vector3 | null = null;
  private moveSpeed: number = 100;

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
    this.id = id;
    this.username = username;
    this.position = new Vector3(startX, startY, startZ);

    this.container = scene.add.container(0, 0);

    const shadow = scene.add.ellipse(0, 8, 24, 12, 0x000000, 0.3);

    this.bodySprite = scene.add.circle(0, 0, 18, 0x00bbff, 1);
    this.bodySprite.setStrokeStyle(3, 0xffffff, 0.8);

    const innerGlow = scene.add.circle(0, -2, 12, 0xffffff, 0.3);

    this.directionIndicator = scene.add.triangle(
      0, -22,
      0, -12,
      6, 0,
      -6, 0,
      0xffdd00,
      1
    );
    this.directionIndicator.setStrokeStyle(2, 0xff8800, 1);

    const centerDot = scene.add.circle(0, 0, 5, 0x0088cc, 1);

    this.nameText = scene.add.text(0, -45, username, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        fill: true
      }
    });
    this.nameText.setOrigin(0.5, 0.5);

    this.container.add([shadow, this.bodySprite, innerGlow, centerDot, this.directionIndicator, this.nameText]);

    this.updateScreenPosition();
    this.updateDirection(this.direction);
  }

  public walkTo(path: Vector3[]): void {
    if (path.length === 0) return;

    this.currentPath = [...path];
    this.currentTarget = this.currentPath.shift() || null;
    this.isWalking = true;
  }

  public stop(): void {
    this.isWalking = false;
    this.currentPath = [];
    this.currentTarget = null;

    this.bodySprite.setY(0);
    this.bodySprite.setScale(1);
  }

  public update(time: number, delta: number): void {
    if (!this.isWalking) {
      const breatheScale = 1 + Math.sin(time / 500) * 0.03;
      this.bodySprite.setScale(breatheScale);
      return;
    }

    if (!this.currentTarget) return;

    const bounceOffset = Math.abs(Math.sin(time / 100)) * 4;
    this.bodySprite.setY(-bounceOffset);

    const currentScreen = IsometricEngine.tileToScreen(
      this.position.x,
      this.position.y,
      this.position.z
    );
    const targetScreen = IsometricEngine.tileToScreen(
      this.currentTarget.x,
      this.currentTarget.y,
      this.currentTarget.z
    );

    const dx = targetScreen.x - currentScreen.x;
    const dy = targetScreen.y - currentScreen.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const moveDistance = (this.moveSpeed * delta) / 1000;

    if (distance <= moveDistance) {
      this.position.set(
        this.currentTarget.x,
        this.currentTarget.y,
        this.currentTarget.z
      );

      if (this.currentPath.length > 0) {
        const nextTarget = this.currentPath.shift()!;

        const dir = this.calculateDirection(this.currentTarget, nextTarget);
        this.updateDirection(dir);

        this.currentTarget = nextTarget;
      } else {
        this.stop();
        this.bodySprite.setY(0);
        this.bodySprite.setScale(1);
      }
    } else {
      const ratio = moveDistance / distance;
      this.position.x += (this.currentTarget.x - this.position.x) * ratio;
      this.position.y += (this.currentTarget.y - this.position.y) * ratio;
      this.position.z += (this.currentTarget.z - this.position.z) * ratio;
    }

    this.updateScreenPosition();
    this.updateDepth();
  }

  private calculateDirection(from: Vector3, to: Vector3): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy < 0) return 4;
    if (dx > 0 && dy < 0) return 3;
    if (dx > 0 && dy === 0) return 2;
    if (dx > 0 && dy > 0) return 1;
    if (dx === 0 && dy > 0) return 0;
    if (dx < 0 && dy > 0) return 7;
    if (dx < 0 && dy === 0) return 6;
    if (dx < 0 && dy < 0) return 5;

    return this.direction;
  }

  private updateDirection(newDirection: number): void {
    this.direction = newDirection;

    const angleMap: Record<number, number> = {
      0: 135,
      1: 90,
      2: 45,
      3: 0,
      4: -45,
      5: -90,
      6: -135,
      7: 180
    };

    const angle = angleMap[newDirection] || 0;

    const targetRotation = Phaser.Math.DegToRad(angle);
    const currentRotation = this.directionIndicator.rotation;
    const rotationDiff = Phaser.Math.Angle.Wrap(targetRotation - currentRotation);
    this.directionIndicator.setRotation(currentRotation + rotationDiff * 0.3);
  }

  private updateScreenPosition(): void {
    const screenPos = IsometricEngine.tileToScreen(
      this.position.x,
      this.position.y,
      this.position.z
    );

    this.container.setPosition(screenPos.x, screenPos.y);
  }

  private updateDepth(): void {
    DepthManager.updateObjectDepth(
      this.container,
      this.position.x,
      this.position.y,
      this.position.z,
      RoomObjectCategory.UNIT
    );
  }

  public getPosition(): Vector3 {
    return this.position.clone();
  }

  public getTilePosition(): { x: number; y: number } {
    return {
      x: Math.round(this.position.x),
      y: Math.round(this.position.y)
    };
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

  public setColor(color: number): void {
    this.bodySprite.setFillStyle(color, 1);
  }

  public setHighlight(enabled: boolean): void {
    if (enabled) {
      this.bodySprite.setStrokeStyle(3, 0xffff00);
    } else {
      this.bodySprite.setStrokeStyle(2, 0x0088cc);
    }
  }
}