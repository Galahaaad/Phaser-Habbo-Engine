import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { HabboAvatarSprite } from '@entities/HabboAvatarSprite';
import { PathFinder } from '@systems/PathFinder';
import { FloorRenderer } from '@systems/FloorRenderer';
import { WallRenderer } from '@systems/WallRenderer';
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
  private hoverGraphics!: Phaser.GameObjects.Graphics;

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
    this.addDebugInfo();
  }

  private setupRenderers(): void {
    this.floorRenderer = new FloorRenderer(this);
    this.floorRenderer.setFloorType('101');

    this.wallRenderer = new WallRenderer(this);
    this.wallRenderer.setWallType('101');

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
    if (!this.roomManager.isTileWalkable(tile.x, tile.y)) {
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
    const { tileMeshes, wallMeshes } = this.meshCache.getMeshes(roomData.tiles);
    const meshTime = performance.now() - startTime;

    console.log(`[RoomScene] Greedy meshing: ${tileMeshes.length} tile meshes, ${wallMeshes.length} wall meshes (${meshTime.toFixed(2)}ms, cached: ${this.meshCache.isCached()})`);

    this.floorRenderer.renderFloor(graphics, tileMeshes);

    this.wallRenderer.setMaxHeight(roomData.maxHeight);
    this.wallRenderer.renderWalls(graphics, wallMeshes);

    this.renderTileDebug();

    console.log('[RoomScene] Room rendered with single Graphics');
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

  private addDebugInfo(): void {
    const debugBg = this.add.rectangle(10, 10, 360, 200, 0x000000, 0.85);
    debugBg.setOrigin(0, 0);
    debugBg.setScrollFactor(0);
    debugBg.setDepth(10000);

    const debugText = this.add.text(20, 30, '', {
      fontSize: '14px',
      color: '#00ff00'
    });
    debugText.setScrollFactor(0);
    debugText.setDepth(10001);

    const closeButton = this.add.text(340, 15, '×', {
      fontSize: '24px',
      color: '#ff0000'
    });
    closeButton.setOrigin(0.5);
    closeButton.setScrollFactor(0);
    closeButton.setDepth(10002);
    closeButton.setInteractive({ useHandCursor: true });

    closeButton.on('pointerover', () => {
      closeButton.setColor('#ffff00');
      closeButton.setScale(1.2);
    });

    closeButton.on('pointerout', () => {
      closeButton.setColor('#ff0000');
      closeButton.setScale(1);
    });

    closeButton.on('pointerdown', () => {
      useGameStore.getState().togglePhaserDebugPanel();
    });

    this.events.on('update', () => {
      const showPanel = useGameStore.getState().showPhaserDebugPanel;
      debugBg.setVisible(showPanel);
      debugText.setVisible(showPanel);
      closeButton.setVisible(showPanel);

      if (!showPanel) return;

      const roomData = this.roomManager.getRoomData();
      const scrollPos = this.cameraManager.getScrollPosition();
      const zoom = this.cameraManager.getZoom();
      const pointer = this.input.activePointer;

      const worldX = pointer.x + scrollPos.x;
      const worldY = pointer.y + scrollPos.y;
      const tilePos = IsometricEngine.screenToTile(worldX, worldY);

      const avatarPos = this.avatar ? this.avatar.getTilePosition() : { x: 0, y: 0 };
      const isMoving = this.avatar ? this.avatar.isMoving() : false;

      debugText.setText([
        'Phaser-Renderer - Debug Mode',
        `Room: ${roomData.name} (${roomData.maxX + 1}x${roomData.maxY + 1})`,
        `Camera: (${Math.round(scrollPos.x)}, ${Math.round(scrollPos.y)}) Zoom: ${zoom.toFixed(2)}`,
        `Mouse Tile: (${Math.floor(tilePos.x)}, ${Math.floor(tilePos.y)})`,
        `Avatar: (${avatarPos.x}, ${avatarPos.y}) ${isMoving ? '[WALKING]' : '[IDLE]'}`,
        '',
        'Controls:',
        '- Mouse Wheel: Zoom',
        '- Left Click + Drag: Pan',
        '- Click on Tile: Walk to tile'
      ]);
    });

    console.log('[RoomScene] Debug info added');
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