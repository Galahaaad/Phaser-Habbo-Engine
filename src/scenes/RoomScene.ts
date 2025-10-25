import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { HabboAvatarSprite } from '@entities/HabboAvatarSprite';
import { PathFinder } from '@systems/PathFinder';
import { FloorRenderer } from '@systems/FloorRenderer';
import { WallRenderer } from '@systems/WallRenderer';
import { DoorRenderer } from '@systems/DoorRenderer';
import { RoomManager } from '@managers/RoomManager';
import { InputManager, TilePosition } from '@managers/InputManager';
import { CameraManager } from '@managers/CameraManager';
import { MeshCache } from '@/utils/MeshCache';
import { useGameStore } from '@core/store';

export class RoomScene extends Phaser.Scene {
  private roomManager!: RoomManager;
  private inputManager!: InputManager;
  private cameraManager!: CameraManager;
  private meshCache!: MeshCache;

  private avatar!: HabboAvatarSprite;
  private pathFinder!: PathFinder;
  private floorRenderer!: FloorRenderer;
  private wallRenderer!: WallRenderer;
  private doorRenderer!: DoorRenderer;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private wallGraphicsObject?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'RoomScene' });
  }

  public init(): void {
    console.log('[RoomScene] Initializing room...');

    this.roomManager = new RoomManager();
    this.meshCache = new MeshCache();

    const roomData = this.roomManager.getRoomData();
    useGameStore.getState().setRoomName(roomData.name);

    console.log('[RoomScene] Loaded room data:', roomData);
  }

  public create(): void {
    console.log('[RoomScene] Creating room visualization...');

    this.cameraManager = new CameraManager(this);
    this.cameraManager.setBackgroundColor('#87CEEB');

    this.inputManager = new InputManager(this, this.roomManager);

    this.createAvatarAtlas();
    this.setupRenderers();
    this.setupAvatar();
    this.setupInputCallbacks();
  }

  private setupRenderers(): void {
    this.floorRenderer = new FloorRenderer(this);
    this.floorRenderer.setFloorType('101');

    this.wallRenderer = new WallRenderer(this);
    this.wallRenderer.setWallType('101');

    this.doorRenderer = new DoorRenderer(this);

    this.hoverGraphics = this.add.graphics();
    this.hoverGraphics.setDepth(998);

    const centerPos = this.roomManager.getCenterPosition();
    this.cameraManager.centerOn(centerPos.x, centerPos.y, 0);

    this.renderRoom();
  }

  private setupAvatar(): void {
    const roomData = this.roomManager.getRoomData();
    this.pathFinder = new PathFinder(roomData.tiles, roomData.maxX, roomData.maxY);

    const centerPos = this.roomManager.getCenterPosition();
    console.log(`[RoomScene] Creating avatar at tile (${centerPos.x}, ${centerPos.y})`);
    this.avatar = new HabboAvatarSprite(this, 1, 'User_Avatar', centerPos.x, centerPos.y, 0);
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
    const frameData: any = {};

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

    console.log('[RoomScene] Avatar atlas created with', Object.keys(frames).length, 'frames');
  }

  private handleTileClick(tile: TilePosition): void {
    console.log(`[RoomScene] Tile clicked: (${tile.x}, ${tile.y})`);

    if (!this.roomManager.isTileWalkable(tile.x, tile.y)) {
      console.log(`[RoomScene] Tile (${tile.x}, ${tile.y}) is not walkable`);
      return;
    }

    const avatarPos = this.avatar.getTilePosition();
    const path = this.pathFinder.findPath(avatarPos.x, avatarPos.y, tile.x, tile.y);

    if (path) {
      this.avatar.walkTo(path);
      this.highlightTile(tile.x, tile.y);

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

  private highlightTile(tileX: number, tileY: number): void {
    const tileCorner = IsometricEngine.tileToScreen(tileX, tileY, 0);
    const screenPos = {
      x: tileCorner.x + 32,
      y: tileCorner.y
    };

    const highlight = this.add.circle(screenPos.x, screenPos.y, 12, 0x00ff00, 0.5);
    highlight.setDepth(999);

    this.tweens.add({
      targets: highlight,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => highlight.destroy()
    });
  }

  private renderRoom(): void {
    const graphics = this.add.graphics();
    const roomData = this.roomManager.getRoomData();

    const startTime = performance.now();
    const { tileMeshes, wallMeshes } = this.meshCache.getMeshes(roomData.tiles, roomData.doorTile);
    const meshTime = performance.now() - startTime;

    console.log(`[RoomScene] Greedy meshing: ${tileMeshes.length} tile meshes, ${wallMeshes.length} wall meshes (${meshTime.toFixed(2)}ms, cached: ${this.meshCache.isCached()})`);

    this.floorRenderer.renderFloor(graphics, tileMeshes, roomData.doorTile);

    if (this.wallGraphicsObject) {
      this.wallGraphicsObject.destroy();
    }
    this.wallGraphicsObject = this.add.graphics();
    this.wallRenderer.setMaxHeight(roomData.maxHeight);
    this.wallRenderer.renderWalls(this.wallGraphicsObject, wallMeshes);

    if (roomData.doorTile) {
      const doorTile = this.roomManager.getTile(roomData.doorTile.x, roomData.doorTile.y);
      if (doorTile) {
        const doorMaskGraphics = this.createDoorMaskGraphics(roomData.doorTile.x, roomData.doorTile.y, doorTile.height);
        const geometryMask = doorMaskGraphics.createGeometryMask();
        geometryMask.invertAlpha = true;
        this.wallGraphicsObject.setMask(geometryMask);
        console.log(`[RoomScene] Door hole created with inverted GeometryMask at (${roomData.doorTile.x}, ${roomData.doorTile.y})`);
      }
    }

    this.renderTileDebug();

    console.log('[RoomScene] Room rendered with GeometryMask invertAlpha');
  }

  private createDoorMaskGraphics(doorX: number, doorY: number, doorZ: number): Phaser.GameObjects.Graphics {
    const doorHeight = 92;
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

  private renderTileDebug(): void {
    const debugGraphics = this.add.graphics();
    debugGraphics.setDepth(10000);
    const roomData = this.roomManager.getRoomData();

    for (let y = 0; y <= roomData.maxY; y++) {
      for (let x = 0; x <= roomData.maxX; x++) {
        const tile = this.roomManager.getTile(x, y);
        if (!tile || !tile.walkable) continue;

        const tileToScreenPos = IsometricEngine.tileToScreen(x, y, tile.height);

        debugGraphics.lineStyle(1, 0xffffff, 0.3);
        debugGraphics.beginPath();
        debugGraphics.moveTo(tileToScreenPos.x, tileToScreenPos.y);
        debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y - 16);
        debugGraphics.lineTo(tileToScreenPos.x + 64, tileToScreenPos.y);
        debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y + 16);
        debugGraphics.closePath();
        debugGraphics.strokePath();
      }
    }
  }

  public update(time: number, delta: number): void {
    if (this.avatar) {
      this.avatar.update(time, delta);

      const isMoving = this.avatar.isMoving();
      const storeMovingState = useGameStore.getState().isAvatarMoving;

      if (isMoving !== storeMovingState) {
        useGameStore.getState().setAvatarMoving(isMoving);
      }
    }

    this.inputManager.update();
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