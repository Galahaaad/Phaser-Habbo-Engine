import { Tile } from '@data/types/RoomData';
import { TileMesh, WallMesh } from '@data/types/MeshData';
import { GreedyMesher } from '@engine/GreedyMesher';

interface CachedMeshes {
  tileMeshes: TileMesh[];
  wallMeshes: WallMesh[];
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

  public getMeshes(tiles: Tile[][], doorTile?: { x: number; y: number }): { tileMeshes: TileMesh[]; wallMeshes: WallMesh[] } {
    const hash = this.generateHash(tiles);

    if (this.cache && this.cache.hash === hash) {
      return {
        tileMeshes: this.cache.tileMeshes,
        wallMeshes: this.cache.wallMeshes
      };
    }

    const mesher = new GreedyMesher(tiles, doorTile);
    const tileMeshes = mesher.getTileMeshes();
    const wallMeshes = mesher.getWallMeshes();

    this.cache = {
      tileMeshes,
      wallMeshes,
      hash
    };

    return { tileMeshes, wallMeshes };
  }

  public invalidate(): void {
    this.cache = null;
  }

  public isCached(): boolean {
    return this.cache !== null;
  }
}
