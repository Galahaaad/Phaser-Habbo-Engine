import Phaser from 'phaser';
import { AssetManager, HabboAssetData, AssetType } from '../managers/AssetManager';

export interface HabboAssetMetadata {
  name: string;
  logicType: string;
  visualizationType: string;
  assets: Record<string, any>;
  logic?: any;
  visualizations?: any[];
  spritesheet: {
    frames: Record<string, any>;
    meta: {
      image: string;
      format: string;
      size: { w: number; h: number };
      scale: number;
    };
  };
}

export class AssetLoader {
  private static assetManager = AssetManager.getInstance();

  public static async loadFurniture(scene: Phaser.Scene, furnitureName: string, useBundle: boolean = false): Promise<void> {
    await this.assetManager.loadAsset('furniture', furnitureName, scene, useBundle);
  }

  public static async loadFigure(scene: Phaser.Scene, figureName: string, useBundle: boolean = false): Promise<void> {
    await this.assetManager.loadAsset('figure', figureName, scene, useBundle);
  }

  public static async loadEffect(scene: Phaser.Scene, effectName: string, useBundle: boolean = false): Promise<void> {
    await this.assetManager.loadAsset('effect', effectName, scene, useBundle);
  }

  public static async loadPet(scene: Phaser.Scene, petName: string, useBundle: boolean = false): Promise<void> {
    await this.assetManager.loadAsset('pet', petName, scene, useBundle);
  }

  public static getMetadata(type: AssetType, assetName: string): HabboAssetData | null {
    return this.assetManager.getMetadata(type, assetName);
  }

  public static isLoaded(type: AssetType, assetName: string): boolean {
    return this.assetManager.isLoaded(type, assetName);
  }

  public static createSpriteFromMetadata(
    scene: Phaser.Scene,
    type: AssetType,
    assetName: string,
    x: number,
    y: number,
    direction: number = 2
  ): Phaser.GameObjects.Image | null {
    const metadata = this.getMetadata(type, assetName);
    if (!metadata || !metadata.spritesheet) return null;

    const collection = this.assetManager.getCollection(type, assetName);
    if (!collection) return null;

    const frameKey = this.findFrameForDirection(metadata as any, direction);
    if (!frameKey) return null;

    const frameData = metadata.spritesheet.frames[frameKey];
    if (!frameData) return null;

    const texture = scene.textures.get(collection.textureKey);
    if (!texture) return null;

    const sourceKey = `${assetName}_${frameKey}`;

    if (!texture.has(sourceKey)) {
      texture.add(
        sourceKey,
        0,
        frameData.frame.x,
        frameData.frame.y,
        frameData.frame.w,
        frameData.frame.h
      );
    }

    const sprite = scene.add.image(x, y, collection.textureKey, sourceKey);

    const assetInfo = this.getAssetInfo(metadata as any, frameKey);
    if (assetInfo) {
      sprite.setOrigin(0.5, 1);
      sprite.setPosition(x + (assetInfo.x || 0), y + (assetInfo.y || 0));
    }

    return sprite;
  }

  private static findFrameForDirection(metadata: HabboAssetMetadata, direction: number): string | null {
    const directionMap: Record<number, number> = {
      0: 2,
      1: 2,
      2: 2,
      3: 4,
      4: 4,
      5: 0,
      6: 0,
      7: 0
    };

    const habboDirection = directionMap[direction] || 2;

    for (const frameName in metadata.spritesheet.frames) {
      if (frameName.includes(`_a_${habboDirection}_0`)) {
        return frameName;
      }
    }

    const firstFrame = Object.keys(metadata.spritesheet.frames)[0];
    return firstFrame || null;
  }

  private static getAssetInfo(metadata: HabboAssetMetadata, frameName: string): any {
    const cleanFrameName = frameName.replace(`${metadata.name}_${metadata.name}_`, `${metadata.name}_`);
    return metadata.assets[cleanFrameName] || null;
  }
}
