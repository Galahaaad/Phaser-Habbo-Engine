import Phaser from 'phaser';
import { BundleLoader } from '../utils/BundleLoader';

export interface HabboAssetData {
  name: string;
  logicType?: string;
  visualizationType?: string;
  assets?: Record<string, any>;
  logic?: any;
  visualizations?: any[];
  spritesheet?: {
    frames: Record<string, any>;
    meta: {
      image: string;
      format: string;
      size: { w: number; h: number };
      scale: number;
    };
  };
}

export interface AssetCollection {
  textureKey: string;
  metaKey: string;
  data: HabboAssetData | null;
  loaded: boolean;
  referenceCount: number;
  lastUsedTimestamp: number;
}

export type AssetType = 'furniture' | 'figure' | 'effect' | 'pet';

export class AssetManager {
  private static instance: AssetManager | null = null;

  private collections: Map<string, AssetCollection> = new Map();
  private loading: Map<string, Promise<void>> = new Map();
  private scenes: Set<Phaser.Scene> = new Set();
  private gcInterval: number | null = null;

  private loadQueue: Array<() => Promise<void>> = [];
  private activeLoads: number = 0;
  private readonly MAX_CONCURRENT_LOADS = 10;

  private constructor() {
    this.startGarbageCollector();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private async processQueue(): Promise<void> {
    while (this.loadQueue.length > 0 && this.activeLoads < this.MAX_CONCURRENT_LOADS) {
      const task = this.loadQueue.shift();
      if (task) {
        this.activeLoads++;
        task().finally(() => {
          this.activeLoads--;
          this.processQueue();
        });
      }
    }
  }

  private enqueueLoad<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.loadQueue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  public registerScene(scene: Phaser.Scene): void {
    this.scenes.add(scene);
  }

  public unregisterScene(scene: Phaser.Scene): void {
    this.scenes.delete(scene);
  }

  public async loadAsset(
    type: AssetType,
    assetName: string,
    scene: Phaser.Scene,
    useBundle: boolean = false
  ): Promise<AssetCollection> {
    const collectionKey = `${type}_${assetName}`;

    if (this.collections.has(collectionKey)) {
      const collection = this.collections.get(collectionKey)!;
      if (collection.loaded) {
        return collection;
      }
    }

    if (this.loading.has(collectionKey)) {
      await this.loading.get(collectionKey);
      return this.collections.get(collectionKey)!;
    }

    const loadPromise = this.enqueueLoad(() =>
      useBundle
        ? this.doLoadBundle(type, assetName, scene, collectionKey)
        : this.doLoad(type, assetName, scene, collectionKey)
    );
    this.loading.set(collectionKey, loadPromise);

    try {
      await loadPromise;
      return this.collections.get(collectionKey)!;
    } finally {
      this.loading.delete(collectionKey);
    }
  }

  private async doLoad(
    type: AssetType,
    assetName: string,
    scene: Phaser.Scene,
    collectionKey: string
  ): Promise<void> {
    const basePath = `/assets/habbo/${type}/${assetName}`;
    const textureKey = `${collectionKey}_texture`;
    const metaKey = `${collectionKey}_meta`;

    return new Promise((resolve, reject) => {
      const loader = scene.load;

      if (!scene.textures.exists(textureKey)) {
        loader.image(textureKey, `${basePath}/${assetName}.png`);
      }

      if (!scene.cache.json.exists(metaKey)) {
        loader.json(metaKey, `${basePath}/${assetName}.json`);
      }

      loader.once('complete', () => {
        const data = scene.cache.json.get(metaKey) as HabboAssetData;

        const collection: AssetCollection = {
          textureKey,
          metaKey,
          data,
          loaded: true,
          referenceCount: 0,
          lastUsedTimestamp: Date.now()
        };

        this.collections.set(collectionKey, collection);
        resolve();
      });

      loader.once('loaderror', (file: any) => {
        console.error(`Failed to load asset: ${assetName}`, file);
        reject(new Error(`Failed to load asset: ${assetName}`));
      });

      loader.start();
    });
  }

  private async doLoadBundle(
    type: AssetType,
    assetName: string,
    scene: Phaser.Scene,
    collectionKey: string
  ): Promise<void> {
    const bundlePath = `/assets/bundles/${type}/${assetName}.habbundle`;
    const textureKey = `${collectionKey}_texture`;
    const metaKey = `${collectionKey}_meta`;

    try {
      const files = await BundleLoader.loadBundle(bundlePath);

      for (const file of files) {
        if (file.type === 'png') {
          const base64 = BundleLoader.arrayBufferToBase64(file.data);
          const imageData = `data:image/png;base64,${base64}`;

          if (!scene.textures.exists(textureKey)) {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                scene.textures.off('addtexture', onAddTexture);
                scene.textures.off('onerror', onError);
                reject(new Error(`Texture loading timeout: ${textureKey}`));
              }, 10000);

              const onAddTexture = (key: string) => {
                if (key === textureKey) {
                  clearTimeout(timeout);
                  scene.textures.off('addtexture', onAddTexture);
                  scene.textures.off('onerror', onError);
                  resolve();
                }
              };

              const onError = (key: string, err: any) => {
                if (key === textureKey) {
                  clearTimeout(timeout);
                  scene.textures.off('addtexture', onAddTexture);
                  scene.textures.off('onerror', onError);
                  reject(err);
                }
              };

              scene.textures.on('addtexture', onAddTexture);
              scene.textures.on('onerror', onError);
              scene.textures.addBase64(textureKey, imageData);
            });
          }
        } else if (file.type === 'json') {
          const jsonData = BundleLoader.parseJSON(file.data);
          scene.cache.json.add(metaKey, jsonData);
        }
      }

      const data = scene.cache.json.get(metaKey) as HabboAssetData;

      const collection: AssetCollection = {
        textureKey,
        metaKey,
        data,
        loaded: true,
        referenceCount: 0,
        lastUsedTimestamp: Date.now()
      };

      this.collections.set(collectionKey, collection);
    } catch (error) {
      console.error(`Failed to load bundle: ${bundlePath}`, error);
      throw error;
    }
  }

  public getCollection(type: AssetType, assetName: string): AssetCollection | null {
    const collectionKey = `${type}_${assetName}`;
    return this.collections.get(collectionKey) || null;
  }

  public getTexture(type: AssetType, assetName: string, scene: Phaser.Scene): Phaser.Textures.Texture | null {
    const collection = this.getCollection(type, assetName);
    if (!collection || !collection.loaded) return null;

    return scene.textures.get(collection.textureKey);
  }

  public getMetadata(type: AssetType, assetName: string): HabboAssetData | null {
    const collection = this.getCollection(type, assetName);
    if (!collection || !collection.loaded) return null;

    return collection.data;
  }

  public isLoaded(type: AssetType, assetName: string): boolean {
    const collection = this.getCollection(type, assetName);
    return collection ? collection.loaded : false;
  }

  public isLoading(type: AssetType, assetName: string): boolean {
    const collectionKey = `${type}_${assetName}`;
    return this.loading.has(collectionKey);
  }

  public async preloadAssets(
    assets: Array<{ type: AssetType; name: string }>,
    scene: Phaser.Scene
  ): Promise<void> {
    const promises = assets.map(asset => this.loadAsset(asset.type, asset.name, scene));
    await Promise.all(promises);
  }

  public unloadAsset(type: AssetType, assetName: string, scene: Phaser.Scene): void {
    const collectionKey = `${type}_${assetName}`;
    const collection = this.collections.get(collectionKey);

    if (!collection) return;

    if (scene.textures.exists(collection.textureKey)) {
      scene.textures.remove(collection.textureKey);
    }

    if (scene.cache.json.exists(collection.metaKey)) {
      scene.cache.json.remove(collection.metaKey);
    }

    this.collections.delete(collectionKey);
  }

  public unloadAll(scene: Phaser.Scene): void {
    for (const [key, collection] of this.collections.entries()) {
      if (scene.textures.exists(collection.textureKey)) {
        scene.textures.remove(collection.textureKey);
      }
      if (scene.cache.json.exists(collection.metaKey)) {
        scene.cache.json.remove(collection.metaKey);
      }
    }
    this.collections.clear();
    this.loading.clear();
  }

  public getLoadedAssets(): string[] {
    return Array.from(this.collections.keys()).filter(
      key => this.collections.get(key)?.loaded
    );
  }

  public addReference(type: AssetType, assetName: string): void {
    const collection = this.getCollection(type, assetName);
    if (collection) {
      collection.referenceCount++;
      collection.lastUsedTimestamp = Date.now();
    }
  }

  public removeReference(type: AssetType, assetName: string): void {
    const collection = this.getCollection(type, assetName);
    if (!collection) return;

    collection.referenceCount--;

    if (collection.referenceCount <= 0) {
      collection.referenceCount = 0;
      collection.lastUsedTimestamp = Date.now();
    }
  }

  private startGarbageCollector(): void {
    if (typeof window === 'undefined') return;

    this.gcInterval = window.setInterval(() => {
      this.garbageCollect();
    }, 30000);
  }

  public stopGarbageCollector(): void {
    if (this.gcInterval !== null) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  private garbageCollect(maxIdleTime: number = 60000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [key, collection] of this.collections.entries()) {
      if (collection.referenceCount === 0) {
        const idleTime = now - collection.lastUsedTimestamp;
        if (idleTime > maxIdleTime) {
          toRemove.push(key);
        }
      }
    }

    if (toRemove.length > 0) {
      console.log(`[AssetManager] Garbage collecting ${toRemove.length} unused assets`);

      toRemove.forEach(key => {
        const collection = this.collections.get(key);
        if (!collection) return;

        for (const scene of this.scenes) {
          if (scene.textures.exists(collection.textureKey)) {
            scene.textures.remove(collection.textureKey);
          }
          if (scene.cache.json.exists(collection.metaKey)) {
            scene.cache.json.remove(collection.metaKey);
          }
        }

        this.collections.delete(key);
      });
    }
  }

  public getStats(): {
    loaded: number;
    loading: number;
    total: number;
    referenced: number;
    idle: number;
  } {
    const collections = Array.from(this.collections.values());
    return {
      loaded: collections.filter(c => c.loaded).length,
      loading: this.loading.size,
      total: this.collections.size,
      referenced: collections.filter(c => c.referenceCount > 0).length,
      idle: collections.filter(c => c.referenceCount === 0).length
    };
  }
}
