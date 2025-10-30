import { IsometricEngine } from '../engine/IsometricEngine';
import { Tile } from '../data/types/RoomData';

interface GridCell {
  tiles: Array<{ tile: Tile; x: number; y: number }>;
}

export class TileSpatialGrid {
  private grid: Map<string, GridCell> = new Map();
  private cellSize: number = 64;

  constructor(tiles: Tile[][]) {
    this.buildGrid(tiles);
  }

  private buildGrid(tiles: Tile[][]): void {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        if (!tile.walkable) continue;

        const screenPos = IsometricEngine.tileToScreen(x, y, tile.height);

        const tileBounds = {
          minX: screenPos.x,
          maxX: screenPos.x + 64,
          minY: screenPos.y - 16,
          maxY: screenPos.y + 16
        };

        const minCellX = Math.floor(tileBounds.minX / this.cellSize);
        const maxCellX = Math.floor(tileBounds.maxX / this.cellSize);
        const minCellY = Math.floor(tileBounds.minY / this.cellSize);
        const maxCellY = Math.floor(tileBounds.maxY / this.cellSize);

        for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
          for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
            const key = `${cellX},${cellY}`;

            if (!this.grid.has(key)) {
              this.grid.set(key, { tiles: [] });
            }

            this.grid.get(key)!.tiles.push({ tile, x, y });
          }
        }
      }
    }
  }

  public getTileAtPosition(worldX: number, worldY: number): { x: number; y: number } | null {
    const cellX = Math.floor(worldX / this.cellSize);
    const cellY = Math.floor(worldY / this.cellSize);
    const key = `${cellX},${cellY}`;

    const cell = this.grid.get(key);
    if (!cell) return null;

    for (const { tile, x, y } of cell.tiles) {
      const tileScreen = IsometricEngine.tileToScreen(x, y, tile.height);
      const centerX = tileScreen.x + 32;
      const centerY = tileScreen.y;

      const dx = worldX - centerX;
      const dy = worldY - centerY;
      const diamondDist = Math.abs(dx / 32) + Math.abs(dy / 16);

      if (diamondDist <= 1.05) {
        return { x, y };
      }
    }

    return null;
  }

  public getCellCount(): number {
    return this.grid.size;
  }

  public getAverageTilesPerCell(): number {
    let total = 0;
    this.grid.forEach(cell => {
      total += cell.tiles.length;
    });
    return total / this.grid.size;
  }
}
