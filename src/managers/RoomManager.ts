import { RoomData, Tile } from '@data/types/RoomData';

export class RoomManager {
  private roomData: RoomData;

  constructor() {
    this.roomData = this.createDefaultRoom();
  }

  private createDefaultRoom(): RoomData {
    const tiles: Tile[][] = [];
    const maxHeight = 0;

    const floorPattern = [
      'xxxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxx00000000',
      'xxxxxxxxxxxxxxxxx00000000',
      'xxxxxxxxxxxxxxxxx00000000',
      'xxxxxxxxxxxxxxxxx00000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'x000000000000000000000000',
      'x000000000000000000000000',
      'x000000000000000000000000',
      'x000000000000000000000000',
      '0000000000000000000000000',
      'x000000000000000000000000',
      'x000000000000000000000000',
      'x000000000000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxx0000000000000000',
      'xxxxxxxxxxxxxxxxxxxxxxxxx'
    ];

    const maxY = floorPattern.length - 1;
    const maxX = floorPattern[0].length - 1;

    for (let y = 0; y <= maxY; y++) {
      tiles[y] = [];
      for (let x = 0; x <= maxX; x++) {
        const isFloor = floorPattern[y][x] === '0';

        tiles[y][x] = {
          x,
          y,
          height: 0,
          isBlocked: false,
          walkable: isFloor
        };
      }
    }

    const doorTile = this.calculateDoorTile(tiles);

    return {
      id: 1,
      name: 'Large Test Room',
      minX: 0,
      maxX,
      minY: 0,
      maxY,
      maxHeight,
      wallType: '101',
      floorType: '101',
      doorTile,
      tiles,
      furniture: [],
      avatars: []
    };
  }

  private calculateDoorTile(tiles: Tile[][]): { x: number; y: number } | undefined {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const topTile = y > 0 && tiles[y - 1][x].walkable;
        const topLeftTile = y > 0 && x > 0 && tiles[y - 1][x - 1].walkable;
        const midLeftTile = x > 0 && tiles[y][x - 1].walkable;
        const botLeftTile = y < tiles.length - 1 && x > 0 && tiles[y + 1][x - 1].walkable;
        const botTile = y < tiles.length - 1 && tiles[y + 1][x].walkable;
        const midTile = tiles[y][x].walkable;

        if (
          !topTile &&
          !topLeftTile &&
          !midLeftTile &&
          !botLeftTile &&
          !botTile &&
          midTile
        ) {
          console.log(`[RoomManager] Door tile detected at: (${x}, ${y})`);
          return { x, y };
        }
      }
    }
    return undefined;
  }

  public getRoomData(): RoomData {
    return this.roomData;
  }

  public getTile(x: number, y: number): Tile | null {
    if (!this.isValidPosition(x, y)) {
      return null;
    }
    return this.roomData.tiles[y][x];
  }

  public isValidPosition(x: number, y: number): boolean {
    return (
      x >= this.roomData.minX &&
      x <= this.roomData.maxX &&
      y >= this.roomData.minY &&
      y <= this.roomData.maxY
    );
  }

  public isTileWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && tile.walkable && !tile.isBlocked;
  }

  public loadRoom(roomData: RoomData): void {
    this.roomData = roomData;
  }

  public async loadFromJSON(url: string): Promise<void> {
    const response = await fetch(url);
    const data = await response.json();
    this.loadRoom(data);
  }

  public getWidth(): number {
    return this.roomData.maxX - this.roomData.minX + 1;
  }

  public getHeight(): number {
    return this.roomData.maxY - this.roomData.minY + 1;
  }

  public getCenterPosition(): { x: number; y: number } {
    return {
      x: (this.roomData.minX + this.roomData.maxX) / 2,
      y: (this.roomData.minY + this.roomData.maxY) / 2
    };
  }
}
