import Phaser from 'phaser';
import { IsometricEngine } from '@engine/IsometricEngine';
import { GreedyMesher } from '@engine/GreedyMesher';
import { RoomData, Tile } from '@data/types/RoomData';
import { HabboAvatarSprite } from '@entities/HabboAvatarSprite';
import { PathFinder } from '@systems/PathFinder';
import { FloorRenderer } from '@systems/FloorRenderer';
import { WallRenderer } from '@systems/WallRenderer';

export class RoomScene extends Phaser.Scene {
  private roomData!: RoomData;
  private avatar!: HabboAvatarSprite;
  private pathFinder!: PathFinder;
  private floorRenderer!: FloorRenderer;
  private wallRenderer!: WallRenderer;
  private cameraControls!: {
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
  };
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private currentHoverTile: { x: number; y: number } | null = null;

  constructor() {
    super({ key: 'RoomScene' });
  }

  public init(): void {
    console.log('[RoomScene] Initializing room...');

    this.cameraControls = {
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    this.loadRoomData();
  }

  private loadRoomData(): void {
    const tiles: Tile[][] = [];
    let maxHeight = 0;

    for (let y = 0; y < 10; y++) {
      tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        tiles[y][x] = {
          x,
          y,
          height: 0,
          isBlocked: false,
          walkable: true
        };
        maxHeight = Math.max(maxHeight, tiles[y][x].height);
      }
    }

    this.roomData = {
      id: 1,
      name: 'Test Room',
      minX: 0,
      maxX: 9,
      minY: 0,
      maxY: 9,
      maxHeight,
      wallType: '101',
      floorType: '101',
      tiles,
      furniture: [],
      avatars: []
    };

    console.log('[RoomScene] Loaded room data:', this.roomData);
  }

  public create(): void {
    console.log('[RoomScene] Creating room visualization...');

    this.cameras.main.setBackgroundColor('#87CEEB');

    this.createAvatarAtlas();

    this.floorRenderer = new FloorRenderer(this);
    this.floorRenderer.setFloorType('101');

    this.wallRenderer = new WallRenderer(this);
    this.wallRenderer.setWallType('101');

    this.hoverGraphics = this.add.graphics();
    this.hoverGraphics.setDepth(998);

    this.setupCamera();
    this.setupControls();
    this.renderRoom();

    this.pathFinder = new PathFinder(this.roomData.tiles, this.roomData.maxX, this.roomData.maxY);

    const startX = (this.roomData.minX + this.roomData.maxX) / 2;
    const startY = (this.roomData.minY + this.roomData.maxY) / 2;
    console.log(`[RoomScene] Creating avatar at tile (${startX}, ${startY})`);
    this.avatar = new HabboAvatarSprite(this, 1, 'User_Avatar', startX, startY, 0);

    this.addDebugInfo();
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

  private setupCamera(): void {
    const camera = this.cameras.main;

    const centerX = (this.roomData.minX + this.roomData.maxX) / 2;
    const centerY = (this.roomData.minY + this.roomData.maxY) / 2;

    const screenCenter = IsometricEngine.tileToScreen(centerX, centerY, 0);

    camera.centerOn(screenCenter.x, screenCenter.y);
    camera.setZoom(1);

    console.log('[RoomScene] Camera centered at:', screenCenter);
  }

  private setupControls(): void {
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(camera.zoom + zoomAmount, 0.5, 2);
      camera.setZoom(newZoom);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.cameraControls.isDragging = true;
        this.cameraControls.dragStartX = pointer.x;
        this.cameraControls.dragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const dragDistance = Math.sqrt(
        Math.pow(pointer.x - this.cameraControls.dragStartX, 2) +
        Math.pow(pointer.y - this.cameraControls.dragStartY, 2)
      );

      if (dragDistance < 5 && pointer.leftButtonReleased()) {
        this.onTileClick(pointer);
      }

      this.cameraControls.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.cameraControls.isDragging) {
        const camera = this.cameras.main;
        const deltaX = pointer.x - this.cameraControls.dragStartX;
        const deltaY = pointer.y - this.cameraControls.dragStartY;

        camera.scrollX -= deltaX / camera.zoom;
        camera.scrollY -= deltaY / camera.zoom;

        this.cameraControls.dragStartX = pointer.x;
        this.cameraControls.dragStartY = pointer.y;
      }
    });

    console.log('[RoomScene] Controls setup complete');
  }

  private getTileAtScreenPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    for (let testY = this.roomData.maxY; testY >= 0; testY--) {
      for (let testX = this.roomData.maxX; testX >= 0; testX--) {
        const tile = this.roomData.tiles[testY][testX];
        if (!tile.walkable) continue;

        const tileScreen = IsometricEngine.tileToScreen(testX, testY, tile.height);
        const centerX = tileScreen.x + 32;
        const centerY = tileScreen.y;

        const dx = worldX - centerX;
        const dy = worldY - centerY;
        const diamondDist = Math.abs(dx / 32) + Math.abs(dy / 16);

        if (diamondDist <= 1.05) {
          return { x: testX, y: testY };
        }
      }
    }

    return null;
  }

  private onTileClick(pointer: Phaser.Input.Pointer): void {
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    const clickedTile = this.getTileAtScreenPosition(worldX, worldY);

    if (!clickedTile) {
      return;
    }

    const tileX = clickedTile.x;
    const tileY = clickedTile.y;

    if (this.roomData.tiles[tileY][tileX].isBlocked) {
      return;
    }

    const avatarPos = this.avatar.getTilePosition();
    const path = this.pathFinder.findPath(avatarPos.x, avatarPos.y, tileX, tileY);

    if (path) {
      this.avatar.walkTo(path);
      this.highlightTile(tileX, tileY);
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

    const mesher = new GreedyMesher(this.roomData.tiles);
    const tileMeshes = mesher.getTileMeshes();
    const wallMeshes = mesher.getWallMeshes();

    console.log(`[RoomScene] Greedy meshing: ${tileMeshes.length} tile meshes, ${wallMeshes.length} wall meshes`);

    this.floorRenderer.renderFloor(graphics, tileMeshes);

    this.wallRenderer.setMaxHeight(this.roomData.maxHeight);
    this.wallRenderer.renderWalls(graphics, wallMeshes);

    this.renderTileDebug();

    console.log('[RoomScene] Room rendered with single Graphics');
  }

  private renderTileDebug(): void {
    const debugGraphics = this.add.graphics();
    debugGraphics.setDepth(10000);

    for (let y = 0; y <= this.roomData.maxY; y++) {
      for (let x = 0; x <= this.roomData.maxX; x++) {
        const tile = this.roomData.tiles[y][x];
        if (!tile.walkable) continue;

        const tileToScreenPos = IsometricEngine.tileToScreen(x, y, tile.height);

        debugGraphics.lineStyle(1, 0xffffff, 0.3);
        debugGraphics.beginPath();
        debugGraphics.moveTo(tileToScreenPos.x, tileToScreenPos.y);
        debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y - 16);
        debugGraphics.lineTo(tileToScreenPos.x + 64, tileToScreenPos.y);
        debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y + 16);
        debugGraphics.closePath();
        debugGraphics.strokePath();

        // RED DIAMONDS: Source of truth for tile positions
        // debugGraphics.lineStyle(2, 0xff0000, 0.8);
        // debugGraphics.beginPath();
        // debugGraphics.moveTo(tileToScreenPos.x, tileToScreenPos.y);
        // debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y - 16);
        // debugGraphics.lineTo(tileToScreenPos.x + 64, tileToScreenPos.y);
        // debugGraphics.lineTo(tileToScreenPos.x + 32, tileToScreenPos.y + 16);
        // debugGraphics.closePath();
        // debugGraphics.strokePath();

        // this.add.text(tileToScreenPos.x + 32, tileToScreenPos.y, `${x},${y}`, {
        //   fontSize: '10px',
        //   color: '#ff0000',
        //   backgroundColor: '#ffffff'
        // }).setOrigin(0.5).setDepth(10001);
      }
    }
  }

  private addDebugInfo(): void {
    const debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
    debugText.setScrollFactor(0);
    debugText.setDepth(10000);

    this.events.on('update', () => {
      const camera = this.cameras.main;
      const pointer = this.input.activePointer;

      const worldX = pointer.x + camera.scrollX;
      const worldY = pointer.y + camera.scrollY;
      const tilePos = IsometricEngine.screenToTile(worldX, worldY);

      const avatarPos = this.avatar ? this.avatar.getTilePosition() : { x: 0, y: 0 };
      const isMoving = this.avatar ? this.avatar.isMoving() : false;

      debugText.setText([
        'Phaser-Renderer - Debug Mode',
        `Room: ${this.roomData.name} (${this.roomData.maxX + 1}x${this.roomData.maxY + 1})`,
        `Camera: (${Math.round(camera.scrollX)}, ${Math.round(camera.scrollY)}) Zoom: ${camera.zoom.toFixed(2)}`,
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
    }

    this.updateHoverTile();
  }

  private updateHoverTile(): void {
    const pointer = this.input.activePointer;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    const hoveredTile = this.getTileAtScreenPosition(worldX, worldY);

    if (hoveredTile && (!this.currentHoverTile || hoveredTile.x !== this.currentHoverTile.x || hoveredTile.y !== this.currentHoverTile.y)) {
      this.currentHoverTile = hoveredTile;
      this.renderHoverTile(hoveredTile.x, hoveredTile.y);
    } else if (!hoveredTile && this.currentHoverTile) {
      this.currentHoverTile = null;
      this.hoverGraphics.clear();
    }
  }

  private renderHoverTile(tileX: number, tileY: number): void {
    this.hoverGraphics.clear();

    const tile = this.roomData.tiles[tileY][tileX];
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