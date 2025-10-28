import { Tile } from '@data/types/RoomData';
import { TileMesh, WallMesh, Vector3D } from '@data/types/MeshData';
import { StairMesh, StairDirection } from '@data/types/StairData';
import { IsometricEngine } from '@engine/IsometricEngine';

export class GreedyMesher {
  private tiles: Tile[][];
  private width: number;
  private height: number;
  private doorTile?: { x: number; y: number };

  constructor(tiles: Tile[][], doorTile?: { x: number; y: number }) {
    this.tiles = tiles;
    this.height = tiles.length;
    this.width = tiles[0]?.length || 0;
    this.doorTile = doorTile;
    this.markWallsOnTiles();
  }

  private markWallsOnTiles(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile && tile.walkable) {
          tile.hasNorthWall = this.shouldHaveNorthWall(x, y);
          tile.hasWestWall = this.shouldHaveWestWall(x, y);
        }
      }
    }
  }

  public getTileMeshes(): TileMesh[] {
    const sizes: Map<string, Vector3D | undefined> = new Map();
    const meshes: TileMesh[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        const key = `${x},${y}`;

        const isDoorTile = this.doorTile && x === this.doorTile.x && y === this.doorTile.y;

        if (tile && tile.walkable && !tile.isBlocked && !isDoorTile) {
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

  private isDoorTile(x: number, y: number): boolean {
    return this.doorTile !== undefined && this.doorTile.x === x && this.doorTile.y === y;
  }

  private isTileWalkableAndNotDoor(x: number, y: number): boolean {
    if (x < 0 || y < 0 || y >= this.height || x >= this.width) return false;
    const tile = this.tiles[y]?.[x];
    return tile !== undefined && tile.walkable && !this.isDoorTile(x, y);
  }

  private shouldHaveNorthWall(x: number, y: number): boolean {
    if (this.isDoorTile(x, y)) return false;
    const tile = this.tiles[y]?.[x];
    if (!tile || !tile.walkable) return false;

    for (let i = y - 1; i >= 0; i--) {
      for (let j = x; j >= 0; j--) {
        if (this.isTileWalkableAndNotDoor(x, i)) return false;
        if (this.isTileWalkableAndNotDoor(j, i)) return false;
      }
    }
    return true;
  }

  private shouldHaveWestWall(x: number, y: number): boolean {
    if (this.isDoorTile(x, y)) return false;
    const tile = this.tiles[y]?.[x];
    if (!tile || !tile.walkable) return false;

    for (let i = x - 1; i >= 0; i--) {
      for (let j = y; j >= 0; j--) {
        if (this.isTileWalkableAndNotDoor(i, y)) return false;
        if (this.isTileWalkableAndNotDoor(i, j)) return false;
      }
    }
    return true;
  }

  public getWallMeshes(): WallMesh[] {
    const meshes: WallMesh[] = [];
    const rowWallSizes: Map<string, Vector3D | undefined> = new Map();
    const columnWallSizes: Map<string, Vector3D | undefined> = new Map();

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (!tile || !tile.walkable || this.isDoorTile(x, y)) continue;

        const key = `${x},${y}`;
        const needsNorthWall = this.shouldHaveNorthWall(x, y);
        const needsWestWall = this.shouldHaveWestWall(x, y);

        if (needsNorthWall) {
          rowWallSizes.set(key, { x: 1, y: 1, z: tile.height });
        }
        if (needsWestWall) {
          columnWallSizes.set(key, { x: 1, y: 1, z: tile.height });
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

    const splitMeshes = this.splitWallMeshesAtDoor(meshes);

    splitMeshes.sort((a, b) => {
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

    return splitMeshes;
  }

  private splitWallMeshesAtDoor(meshes: WallMesh[]): WallMesh[] {
    if (!this.doorTile) return meshes;

    const result: WallMesh[] = [];

    for (const mesh of meshes) {
      const { position, length, direction } = mesh;
      let doorInMesh = false;

      if (direction === 'north') {
        const startX = position.x;
        const endX = position.x + length - 1;
        const meshY = position.y;

        if (meshY === this.doorTile.y && this.doorTile.x >= startX && this.doorTile.x <= endX) {
          doorInMesh = true;

          if (this.doorTile.x > startX) {
            result.push({
              position: { x: startX, y: meshY, z: position.z },
              length: this.doorTile.x - startX,
              direction: 'north',
              corner: mesh.corner
            });
          }

          if (this.doorTile.x < endX) {
            result.push({
              position: { x: this.doorTile.x + 1, y: meshY, z: position.z },
              length: endX - this.doorTile.x,
              direction: 'north',
              corner: false
            });
          }
        }
      } else if (direction === 'west') {
        const meshX = position.x;
        const startY = position.y;
        const endY = position.y + length - 1;

        if (meshX === this.doorTile.x && this.doorTile.y >= startY && this.doorTile.y <= endY) {
          doorInMesh = true;

          if (this.doorTile.y > startY) {
            result.push({
              position: { x: meshX, y: startY, z: position.z },
              length: this.doorTile.y - startY,
              direction: 'west',
              corner: mesh.corner
            });
          }

          if (this.doorTile.y < endY) {
            result.push({
              position: { x: meshX, y: this.doorTile.y + 1, z: position.z },
              length: endY - this.doorTile.y,
              direction: 'west',
              corner: false
            });
          }
        }
      }

      if (!doorInMesh) {
        result.push(mesh);
      }
    }

    return result;
  }

  public getStairMeshes(): StairMesh[] {
    const stairs: StairMesh[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y]?.[x];
        if (!tile || !tile.walkable) continue;

        const topTile = this.tiles[y - 1]?.[x];
        const leftTile = this.tiles[y]?.[x - 1];
        const rightTile = this.tiles[y]?.[x + 1];
        const topLeftTile = this.tiles[y - 1]?.[x - 1];
        const bottomLeftTile = this.tiles[y + 1]?.[x - 1];
        const topRightTile = this.tiles[y - 1]?.[x + 1];

        if (topTile && topTile.walkable && topTile.height - tile.height === 1) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: StairDirection.NORTH,
            length: 1,
            corner: null
          });
          continue;
        }

        if (leftTile && leftTile.walkable && leftTile.height - tile.height === 1) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: StairDirection.WEST,
            length: 1,
            corner: null
          });
          continue;
        }

        const bottomTile = this.tiles[y + 1]?.[x];
        if (bottomTile && bottomTile.walkable && bottomTile.height - tile.height === 1) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: StairDirection.SOUTH,
            length: 1,
            corner: null
          });
          continue;
        }

        if (rightTile && rightTile.walkable && rightTile.height - tile.height === 1) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: StairDirection.EAST,
            length: 1,
            corner: null
          });
          continue;
        }

        if (bottomLeftTile && bottomLeftTile.walkable && bottomLeftTile.height - tile.height === 1 &&
            (!leftTile || !leftTile.walkable || leftTile.height <= tile.height)) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: null,
            length: 1,
            corner: 'left'
          });
          continue;
        }

        if (topRightTile && topRightTile.walkable && topRightTile.height - tile.height === 1 &&
            (!rightTile || !rightTile.walkable || rightTile.height <= tile.height)) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: null,
            length: 1,
            corner: 'right'
          });
          continue;
        }

        if (topLeftTile && topLeftTile.walkable && topLeftTile.height - tile.height === 1 &&
            (!leftTile || !leftTile.walkable || leftTile.height <= tile.height)) {
          stairs.push({
            position: { x, y, z: tile.height },
            direction: null,
            length: 1,
            corner: 'front'
          });
          continue;
        }
      }
    }

    console.log('Detected stairs:', stairs.map(s => ({
      pos: `(${s.position.x},${s.position.y})`,
      dir: s.direction !== null ? (s.direction === 0 ? 'NORTH' : 'WEST') : 'corner',
      corner: s.corner
    })));

    return stairs;
  }
}
