import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { DepthManager } from '@engine/DepthManager';
import { HabboAvatarSprite } from '@entities/HabboAvatarSprite';
import { PathFinder } from '@systems/PathFinder';
import { FloorRenderer } from '@systems/FloorRenderer';
import { WallRenderer } from '@systems/WallRenderer';
import { StairRenderer } from '@systems/StairRenderer';
import { RoomManager } from '@managers/RoomManager';
import { InputManager, TilePosition } from '@managers/InputManager';
import { CameraManager } from '@managers/CameraManager';
import { MeshCache } from '@/utils/MeshCache';
import { useGameStore } from '@core/store';
import { RoomObjectCategory } from '@data/types/RoomData';

export class RoomScene extends Phaser.Scene {
  private roomManager!: RoomManager;
  private inputManager!: InputManager;
  private cameraManager!: CameraManager;
  private meshCache!: MeshCache;

  private avatar!: HabboAvatarSprite;
  private pathFinder!: PathFinder;
  private floorRenderer!: FloorRenderer;
  private wallRenderer!: WallRenderer;
  private stairRenderer!: StairRenderer;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private wallGraphicsObject?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'RoomScene' });
  }

  public init(): void {
    this.roomManager = new RoomManager();
    this.meshCache = new MeshCache();

    const roomData = this.roomManager.getRoomData();
    useGameStore.getState().setRoomName(roomData.name);
  }

  public create(): void {
    this.cameraManager = new CameraManager(this);
    this.cameraManager.setBackgroundColor('#0c547a');

    this.inputManager = new InputManager(this, this.roomManager);

    this.game.events.on('floorplan-updated', this.handleFloorplanUpdate, this);

    this.createAvatarAtlas();
    this.setupRenderers();
    this.setupAvatar();
    this.setupInputCallbacks();
  }

  public shutdown(): void {
    if (this.cameraManager) {
      this.cameraManager.destroy();
    }

    if (this.inputManager) {
      this.inputManager.destroy();
    }

    if (this.avatar) {
      this.avatar.destroy();
    }

    if (this.wallGraphicsObject) {
      this.wallGraphicsObject.destroy();
    }

    if (this.hoverGraphics) {
      this.hoverGraphics.destroy();
    }
  }

  private setupRenderers(): void {
    this.floorRenderer = new FloorRenderer(this);
    this.floorRenderer.setFloorType('101');

    this.wallRenderer = new WallRenderer(this);
    this.wallRenderer.setWallType('101');

    this.stairRenderer = new StairRenderer(this);

    this.hoverGraphics = this.add.graphics();
    this.hoverGraphics.setDepth(998);

    const centerPos = this.roomManager.getCenterPosition();
    this.cameraManager.centerOn(centerPos.x, centerPos.y, 0);

    this.renderRoom();
  }

  private setupAvatar(): void {
    const roomData = this.roomManager.getRoomData();
    this.pathFinder = new PathFinder(roomData.tiles, roomData.maxX, roomData.maxY, roomData.doorTile);

    const spawnPos = roomData.doorTile || this.roomManager.getCenterPosition();
    const spawnTile = this.roomManager.getTile(spawnPos.x, spawnPos.y);
    const spawnZ = spawnTile?.height || 0;

    this.avatar = new HabboAvatarSprite(this, 1, 'User_Avatar', spawnPos.x, spawnPos.y, spawnZ);
    this.updateAvatarDepthRelativeToDoor();
  }

  private setupInputCallbacks(): void {
    this.inputManager.onTileClick((tile) => this.handleTileClick(tile));
    this.inputManager.onTileHover((tile) => this.handleTileHover(tile));
  }

  private createAvatarAtlas(): void {
    const meta = this.cache.json.get('avatar_body_meta');

    if (!meta || !meta.spritesheet) return;

    const textureKey = 'avatar_body';
    const imageKey = 'avatar_body_texture';

    if (this.textures.exists(textureKey)) return;

    const frames = meta.spritesheet.frames;
    interface FrameData {
      [key: string]: {
        frame: { x: number; y: number; w: number; h: number };
        rotated: boolean;
        trimmed: boolean;
        spriteSourceSize: { x: number; y: number; w: number; h: number };
        sourceSize: { w: number; h: number };
      };
    }
    const frameData: FrameData = {};

    for (const frameName in frames) {
      const frame = frames[frameName];
      const cleanName = frameName.replace('hh_human_body_', '');

      frameData[cleanName] = {
        frame: frame.frame,
        rotated: false,
        trimmed: frame.trimmed || false,
        spriteSourceSize: frame.spriteSourceSize,
        sourceSize: frame.sourceSize
      };
    }

    const atlasData = {
      frames: frameData,
      meta: {
        image: imageKey,
        format: 'RGBA8888',
        size: meta.spritesheet.meta.size,
        scale: 1
      }
    };

    this.textures.addAtlas(textureKey, this.textures.get(imageKey).getSourceImage() as HTMLImageElement, atlasData);
  }

  private handleTileClick(tile: TilePosition): void {
    if (!this.roomManager.isTileWalkable(tile.x, tile.y)) {
      return;
    }

    const avatarPos = this.avatar.getTilePosition();
    const path = this.pathFinder.findPath(avatarPos.x, avatarPos.y, tile.x, tile.y);

    if (path) {
      this.avatar.walkTo(path);

      useGameStore.getState().setAvatarMoving(true);
      useGameStore.getState().setAvatarPosition({
        x: tile.x,
        y: tile.y,
        z: this.roomManager.getTile(tile.x, tile.y)?.height || 0
      });
    }
  }

  private handleTileHover(tile: TilePosition | null): void {
    if (tile) {
      this.renderHoverTile(tile.x, tile.y);
    } else {
      this.hoverGraphics.clear();
    }
  }

  private handleFloorplanUpdate(data: any): void {
    console.log('Reloading room with new data:', data);

    const { pattern, wallHeight, wallThickness, floorThickness } = data;

    const childrenToDestroy: Phaser.GameObjects.GameObject[] = [];
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Graphics ||
          child instanceof Phaser.GameObjects.Container ||
          child instanceof Phaser.GameObjects.Image ||
          child instanceof Phaser.GameObjects.Sprite) {
        if (child !== this.avatar && child !== this.hoverGraphics) {
          childrenToDestroy.push(child);
        }
      }
    });

    childrenToDestroy.forEach(child => child.destroy());

    this.roomManager = new RoomManager(pattern);
    this.meshCache = new MeshCache();
    this.inputManager = new InputManager(this, this.roomManager);

    if (wallHeight !== undefined) {
      this.wallRenderer.setWallHeight(wallHeight);
    }
    if (wallThickness !== undefined) {
      this.wallRenderer.setWallThickness(wallThickness);
    }
    if (floorThickness !== undefined) {
      this.wallRenderer.setFloorThickness(floorThickness);
    }

    this.renderRoom();

    if (this.avatar) {
      this.avatar.destroy();
      this.setupAvatar();
    }
  }

  private renderRoom(): void {
    const roomData = this.roomManager.getRoomData();

    const { tileMeshes, wallMeshes, stairMeshes } = this.meshCache.getMeshes(roomData.tiles, roomData.doorTile);

    const stairTilePositions = new Set<string>();

    const graphics = this.add.graphics();
    graphics.setDepth(1);

    const tilesByHeight = new Map<number, TileMesh[]>();
    tileMeshes.forEach(mesh => {
      const height = mesh.position.z;
      if (!tilesByHeight.has(height)) {
        tilesByHeight.set(height, []);
      }
      tilesByHeight.get(height)!.push(mesh);
    });

    tilesByHeight.forEach((meshes, height) => {
      const tileGraphics = this.add.graphics();
      const tileDepth = 100 + (height * 10) + 4;
      tileGraphics.setDepth(tileDepth);
      this.floorRenderer.renderFloor(tileGraphics, meshes, roomData.doorTile, stairTilePositions);
    });

    this.stairRenderer.renderStairs(stairMeshes);

    if (this.wallGraphicsObject) {
      this.wallGraphicsObject.destroy();
    }

    this.wallGraphicsObject = this.add.graphics();
    // @ts-ignore
      const doorDepth = DepthManager.getCategoryLayerOffset(RoomObjectCategory.DOOR);
    this.wallGraphicsObject.setDepth(doorDepth);

    this.wallRenderer.setMaxHeight(roomData.maxHeight);
    this.wallRenderer.renderWalls(this.wallGraphicsObject, wallMeshes);

    if (roomData.doorTile) {
      const doorTile = this.roomManager.getTile(roomData.doorTile.x, roomData.doorTile.y);
      if (doorTile) {
        this.renderDoorTile(graphics, roomData.doorTile.x, roomData.doorTile.y, doorTile.height);

        const doorMaskGraphics = this.createDoorMaskGraphics(roomData.doorTile.x, roomData.doorTile.y, doorTile.height);
        const geometryMask = doorMaskGraphics.createGeometryMask();
        geometryMask.invertAlpha = true;
        this.wallGraphicsObject.setMask(geometryMask);
      }
    }

    this.renderTileBorders(stairTilePositions);
  }

  private renderTileBorders(stairTilePositions: Set<string>): void {
    const borderGraphicsByHeight = new Map<number, Phaser.GameObjects.Graphics>();
    const roomData = this.roomManager.getRoomData();

    for (let y = 0; y <= roomData.maxY; y++) {
      for (let x = 0; x <= roomData.maxX; x++) {
        const tile = this.roomManager.getTile(x, y);
        if (!tile || !tile.walkable) continue;

        if (roomData.doorTile && x === roomData.doorTile.x && y === roomData.doorTile.y) {
          continue;
        }

        if (stairTilePositions.has(`${x},${y}`)) {
          continue;
        }

        const height = tile.height;
        if (!borderGraphicsByHeight.has(height)) {
          const borderGraphics = this.add.graphics();
          const borderDepth = 100 + (height * 10) + 4.5;
          borderGraphics.setDepth(borderDepth);
          borderGraphicsByHeight.set(height, borderGraphics);
        }

        const tileToScreenPos = IsometricEngine.tileToScreen(x, y, tile.height);
        const borderGraphics = borderGraphicsByHeight.get(height)!;

        borderGraphics.lineStyle(1, 0x8f8f5f, 1);
        borderGraphics.beginPath();
        borderGraphics.moveTo(tileToScreenPos.x, tileToScreenPos.y);
        borderGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y - 16);
        borderGraphics.lineTo(tileToScreenPos.x + 64, tileToScreenPos.y);
        borderGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y + 16);
        borderGraphics.closePath();
        borderGraphics.strokePath();
      }
    }
  }

  private renderDoorTile(graphics: Phaser.GameObjects.Graphics, doorX: number, doorY: number, doorZ: number): void {
    const tileScreen = IsometricEngine.tileToScreen(doorX, doorY, doorZ);

    graphics.fillStyle(0x999966, 1);
    graphics.beginPath();
    graphics.moveTo(tileScreen.x, tileScreen.y);
    graphics.lineTo(tileScreen.x + 32, tileScreen.y - 16);
    graphics.lineTo(tileScreen.x + 64, tileScreen.y);
    graphics.lineTo(tileScreen.x + 32, tileScreen.y + 16);
    graphics.closePath();
    graphics.fillPath();
  }

  private createDoorMaskGraphics(doorX: number, doorY: number, doorZ: number): Phaser.GameObjects.Graphics {
    const doorHeight = 80;
    const tileBase = {
      x: 32 * (doorX + 1) - 32 * doorY,
      y: 16 * (doorX + 1) + 16 * doorY - 32 * doorZ
    };

    const westCorner = { x: tileBase.x, y: tileBase.y };
    const northCorner = { x: tileBase.x + 32, y: tileBase.y - 16 };

    const doorMaskGraphics = this.add.graphics();
    doorMaskGraphics.fillStyle(0xffffff, 1);
    doorMaskGraphics.beginPath();
    doorMaskGraphics.moveTo(westCorner.x, westCorner.y - doorHeight);
    doorMaskGraphics.lineTo(northCorner.x, northCorner.y - doorHeight);
    doorMaskGraphics.lineTo(northCorner.x, northCorner.y);
    doorMaskGraphics.lineTo(westCorner.x, westCorner.y);
    doorMaskGraphics.closePath();
    doorMaskGraphics.fillPath();
    doorMaskGraphics.setVisible(false);

    return doorMaskGraphics;
  }

  public update(time: number, delta: number): void{
    if (this.avatar) {
      this.avatar.update(time, delta);

      const isMoving = this.avatar.isMoving();
      const storeMovingState = useGameStore.getState().isAvatarMoving;

      if (isMoving !== storeMovingState) {
        useGameStore.getState().setAvatarMoving(isMoving);
      }

      this.updateAvatarDepthRelativeToDoor();
    }

    this.inputManager.update();
  }

  private updateAvatarDepthRelativeToDoor(): void {
    const roomData = this.roomManager.getRoomData();
    if (!roomData.doorTile) return;

    const avatarPos = this.avatar.getPosition();
    const doorTile = this.roomManager.getTile(roomData.doorTile.x, roomData.doorTile.y);
    if (!doorTile) return;

    const dx = avatarPos.x - roomData.doorTile.x;
    const dy = avatarPos.y - roomData.doorTile.y;
    const distanceToDoor = Math.sqrt(dx * dx + dy * dy);

    // @ts-ignore
      const doorGraphicsDepth = DepthManager.getCategoryLayerOffset(RoomObjectCategory.DOOR);

    if (distanceToDoor <= 0.5) {
      const finalDepth = doorGraphicsDepth - 100000;
      this.avatar.setDepth(finalDepth);
    } else {
      const finalDepth = doorGraphicsDepth + 100000;
      this.avatar.setDepth(finalDepth);
    }
  }

  private renderHoverTile(tileX: number, tileY: number): void {
    this.hoverGraphics.clear();

    const tile = this.roomManager.getTile(tileX, tileY);
    if (!tile) return;

    const tileScreen = IsometricEngine.tileToScreen(tileX, tileY, tile.height);

    this.hoverGraphics.fillStyle(0xffffff, 0.2);
    this.hoverGraphics.lineStyle(2, 0xffffff, 0.8);
    this.hoverGraphics.beginPath();
    this.hoverGraphics.moveTo(tileScreen.x, tileScreen.y);
    this.hoverGraphics.lineTo(tileScreen.x + 32, tileScreen.y - 16);
    this.hoverGraphics.lineTo(tileScreen.x + 64, tileScreen.y);
    this.hoverGraphics.lineTo(tileScreen.x + 32, tileScreen.y + 16);
    this.hoverGraphics.closePath();
    this.hoverGraphics.fillPath();
    this.hoverGraphics.strokePath();
  }
}