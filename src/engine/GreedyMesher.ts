import { Tile } from '@data/types/RoomData';
import { TileMesh, WallMesh, Vector3D } from '@data/types/MeshData';
import { IsometricEngine } from '@engine/IsometricEngine';

export class GreedyMesher {
  private tiles: Tile[][];
  private width: number;
  private height: number;

  constructor(tiles: Tile[][]) {
    this.tiles = tiles;
    this.height = tiles.length;
    this.width = tiles[0]?.length || 0;
  }

  public getTileMeshes(): TileMesh[] {
    const sizes: Map<string, Vector3D | undefined> = new Map();
    const meshes: TileMesh[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        const key = `${x},${y}`;

        if (tile && tile.walkable && !tile.isBlocked) {
          sizes.set(key, { x: 1, y: 1, z: tile.height });
        } else {
          sizes.set(key, undefined);
        }
      }
    }

    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentKey = `${x},${y}`;
        const prevKey = `${x},${y - 1}`;

        const currentTile = this.tiles[y][x];
        const prevTile = this.tiles[y - 1]?.[x];

        if (
          currentTile &&
          prevTile &&
          currentTile.walkable &&
          prevTile.walkable &&
          currentTile.height === prevTile.height
        ) {
          const current = sizes.get(currentKey);
          const prev = sizes.get(prevKey);

          if (current && prev) {
            current.y += prev.y;
            sizes.set(prevKey, undefined);
          }
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 1; x < this.width; x++) {
        const currentKey = `${x},${y}`;
        const prevKey = `${x - 1},${y}`;

        const currentTile = this.tiles[y][x];
        const prevTile = this.tiles[y][x - 1];

        if (
          !prevTile ||
          !prevTile.walkable ||
          !currentTile ||
          !currentTile.walkable ||
          currentTile.height !== prevTile.height
        ) {
          continue;
        }

        const current = sizes.get(currentKey);
        const prev = sizes.get(prevKey);

        if (current && prev && current.y === prev.y) {
          current.x += prev.x;
          sizes.set(prevKey, undefined);
        }
      }
    }

    sizes.forEach((size, key) => {
      if (size) {
        const [x, y] = key.split(',').map(Number);

        meshes.push({
          position: {
            x: x - size.x + 1,
            y: y - size.y + 1,
            z: size.z
          },
          size,
          door: false
        });
      }
    });

    meshes.sort((a, b) => {
      const depthA = IsometricEngine.calculateDepth(
        a.position.x,
        a.position.y,
        a.position.z,
        6
      );
      const depthB = IsometricEngine.calculateDepth(
        b.position.x,
        b.position.y,
        b.position.z,
        6
      );
      return depthA - depthB;
    });

    return meshes;
  }

  public getWallMeshes(): WallMesh[] {
    const meshes: WallMesh[] = [];
    const rowWallSizes: Map<string, Vector3D | undefined> = new Map();
    const columnWallSizes: Map<string, Vector3D | undefined> = new Map();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        const key = `${x},${y}`;

        if (tile && tile.walkable) {
          const isLeftEdge = x === 0 || !this.tiles[y][x - 1]?.walkable;
          const isTopEdge = y === 0 || !this.tiles[y - 1]?.[x]?.walkable;

          if (isTopEdge) {
            rowWallSizes.set(key, { x: 1, y: 1, z: tile.height });
          }
          if (isLeftEdge) {
            columnWallSizes.set(key, { x: 1, y: 1, z: tile.height });
          }
        }
      }
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 1; x < this.width; x++) {
        const currentKey = `${x},${y}`;
        const prevKey = `${x - 1},${y}`;

        const current = rowWallSizes.get(currentKey);
        const prev = rowWallSizes.get(prevKey);

        if (current && prev && current.z === prev.z && current.y === prev.y) {
          current.x += prev.x;
          rowWallSizes.set(prevKey, undefined);
        }
      }
    }

    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentKey = `${x},${y}`;
        const prevKey = `${x},${y - 1}`;

        const current = columnWallSizes.get(currentKey);
        const prev = columnWallSizes.get(prevKey);

        if (current && prev && current.z === prev.z && current.x === prev.x) {
          current.y += prev.y;
          columnWallSizes.set(prevKey, undefined);
        }
      }
    }

    rowWallSizes.forEach((size, key) => {
      if (size) {
        const [x, y] = key.split(',').map(Number);

        meshes.push({
          position: {
            x: x - size.x + 1,
            y: y - size.y + 1,
            z: size.z
          },
          length: size.x,
          direction: 'north',
          corner: false
        });
      }
    });

    columnWallSizes.forEach((size, key) => {
      if (size) {
        const [x, y] = key.split(',').map(Number);
        const startX = x - size.x + 1;
        const startY = y - size.y + 1;

        const tile = this.tiles[startY]?.[startX];
        const isCorner = tile &&
          (startY === 0 || !this.tiles[startY - 1]?.[startX]?.walkable) &&
          (startX === 0 || !this.tiles[startY]?.[startX - 1]?.walkable);

        meshes.push({
          position: {
            x: startX,
            y: startY,
            z: size.z
          },
          length: size.y,
          direction: 'west',
          corner: isCorner
        });
      }
    });

    meshes.sort((a, b) => {
      const depthA = IsometricEngine.calculateWallDepth(
        a.position.x,
        a.position.y,
        6
      );
      const depthB = IsometricEngine.calculateWallDepth(
        b.position.x,
        b.position.y,
        6
      );
      return depthA - depthB;
    });

    return meshes;
  }
}
