import Phaser from 'phaser';

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
  private static readonly BASE_PATH = '/assets/habbo';

  public static loadFurniture(scene: Phaser.Scene, furnitureName: string, key?: string): void {
    const assetKey = key || furnitureName;
    const basePath = `${this.BASE_PATH}/furniture/${furnitureName}`;

    scene.load.image(`${assetKey}_texture`, `${basePath}/${furnitureName}.png`);
    scene.load.json(`${assetKey}_meta`, `${basePath}/${furnitureName}.json`);
  }

  public static loadFigure(scene: Phaser.Scene, figureName: string, key?: string): void {
    const assetKey = key || figureName;
    const basePath = `${this.BASE_PATH}/figure/${figureName}`;

    scene.load.image(`${assetKey}_texture`, `${basePath}/${figureName}.png`);
    scene.load.json(`${assetKey}_meta`, `${basePath}/${figureName}.json`);
  }

  public static loadEffect(scene: Phaser.Scene, effectName: string, key?: string): void {
    const assetKey = key || effectName;
    const basePath = `${this.BASE_PATH}/effect/${effectName}`;

    scene.load.image(`${assetKey}_texture`, `${basePath}/${effectName}.png`);
    scene.load.json(`${assetKey}_meta`, `${basePath}/${effectName}.json`);
  }

  public static getMetadata(scene: Phaser.Scene, key: string): HabboAssetMetadata | null {
    return scene.cache.json.get(`${key}_meta`);
  }

  public static createSpriteFromMetadata(
    scene: Phaser.Scene,
    key: string,
    x: number,
    y: number,
    direction: number = 2
  ): Phaser.GameObjects.Image | null {
    const metadata = this.getMetadata(scene, key);
    if (!metadata) return null;

    const textureName = `${key}_texture`;

    const frameKey = this.findFrameForDirection(metadata, direction);
    if (!frameKey) return null;

    const frameData = metadata.spritesheet.frames[frameKey];
    if (!frameData) return null;

    const texture = scene.textures.get(textureName);
    if (!texture) return null;

    const sourceKey = `${key}_${frameKey}`;

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

    const sprite = scene.add.image(x, y, textureName, sourceKey);

    const assetInfo = this.getAssetInfo(metadata, frameKey);
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
