import { RoomData, Tile } from '@data/types/RoomData';

export class RoomManager {
  private roomData: RoomData;

  constructor() {
    this.roomData = this.createDefaultRoom();
  }

  private createDefaultRoom(): RoomData {
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

    return {
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
