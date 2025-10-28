import { Tile } from '@data/types/RoomData';
import { TileMesh, WallMesh } from '@data/types/MeshData';
import { StairMesh } from '@data/types/StairData';
import { GreedyMesher } from '@engine/GreedyMesher';

interface CachedMeshes {
  tileMeshes: TileMesh[];
  wallMeshes: WallMesh[];
  stairMeshes: StairMesh[];
  hash: string;
}

export class MeshCache {
  private cache: CachedMeshes | null = null;

  private generateHash(tiles: Tile[][]): string {
    const hashParts: string[] = [];

    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        hashParts.push(`${tile.height}${tile.walkable ? 1 : 0}${tile.isBlocked ? 1 : 0}`);
      }
    }

    return hashParts.join('-');
  }

  public getMeshes(tiles: Tile[][], doorTile?: { x: number; y: number }): { tileMeshes: TileMesh[]; wallMeshes: WallMesh[]; stairMeshes: StairMesh[] } {
    const hash = this.generateHash(tiles);

    if (this.cache && this.cache.hash === hash) {
      return {
        tileMeshes: this.cache.tileMeshes,
        wallMeshes: this.cache.wallMeshes,
        stairMeshes: this.cache.stairMeshes
      };
    }

    const mesher = new GreedyMesher(tiles, doorTile);
    const tileMeshes = mesher.getTileMeshes();
    const wallMeshes = mesher.getWallMeshes();
    const stairMeshes = mesher.getStairMeshes();

    this.cache = {
      tileMeshes,
      wallMeshes,
      stairMeshes,
      hash
    };

    return { tileMeshes, wallMeshes, stairMeshes };
  }

  public invalidate(): void {
    this.cache = null;
  }

  public isCached(): boolean {
    return this.cache !== null;
  }
}
