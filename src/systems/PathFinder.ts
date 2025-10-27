import { Tile } from '@data/types/RoomData';
import { Vector3 } from '@data/types/Vector3';

class PathNode {
  public x: number;
  public y: number;
  public g: number = 0;
  public h: number = 0;
  public f: number = 0;
  public parent: PathNode | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public calculateH(endX: number, endY: number): void {
    this.h = Math.abs(this.x - endX) + Math.abs(this.y - endY);
  }

  public calculateF(): void {
    this.f = this.g + this.h;
  }

  public equals(other: PathNode): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export class PathFinder {
  private tiles: Tile[][];
  private maxX: number;
  private maxY: number;
  private doorTile?: { x: number; y: number };

  constructor(tiles: Tile[][], maxX: number, maxY: number, doorTile?: { x: number; y: number }) {
    this.tiles = tiles;
    this.maxX = maxX;
    this.maxY = maxY;
    this.doorTile = doorTile;
  }

  public findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Vector3[] | null {
    if (!this.isValidTile(startX, startY) || !this.isValidTile(endX, endY)) {
      return null;
    }

    if (startX === endX && startY === endY) {
      return [];
    }

    if (this.tiles[endY][endX].isBlocked) {
      return null;
    }

    const startNode = new PathNode(startX, startY);
    const endNode = new PathNode(endX, endY);

    const openList: PathNode[] = [];
    const closedList: PathNode[] = [];

    openList.push(startNode);

    while (openList.length > 0) {
      let currentNode = openList[0];
      let currentIndex = 0;

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }

      openList.splice(currentIndex, 1);
      closedList.push(currentNode);

      if (currentNode.equals(endNode)) {
        return this.reconstructPath(currentNode);
      }

      const neighbors = this.getNeighbors(currentNode.x, currentNode.y);

      for (const neighbor of neighbors) {
        if (closedList.some(node => node.equals(neighbor))) {
          continue;
        }

        const isDiagonal = neighbor.x !== currentNode.x && neighbor.y !== currentNode.y;
        const moveCost = isDiagonal ? 1.414 : 1;
        const tentativeG = currentNode.g + moveCost;

        const existingNode = openList.find(node => node.equals(neighbor));

        if (!existingNode) {
          neighbor.g = tentativeG;
          neighbor.calculateH(endX, endY);
          neighbor.calculateF();
          neighbor.parent = currentNode;
          openList.push(neighbor);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.calculateF();
          existingNode.parent = currentNode;
        }
      }
    }

    return null;
  }

  private getNeighbors(x: number, y: number): PathNode[] {
    const neighbors: PathNode[] = [];

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 }
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (!this.isValidTile(newX, newY) || this.tiles[newY][newX].isBlocked) {
        continue;
      }

      if (!this.canMoveBetweenTiles(x, y, newX, newY)) {
        continue;
      }

      if (dir.dx !== 0 && dir.dy !== 0) {
        const checkX = this.isValidTile(x + dir.dx, y) && !this.tiles[y][x + dir.dx].isBlocked;
        const checkY = this.isValidTile(x, y + dir.dy) && !this.tiles[y + dir.dy][x].isBlocked;

        if (!checkX || !checkY) {
          continue;
        }

        const canMoveX = this.canMoveBetweenTiles(x, y, x + dir.dx, y);
        const canMoveY = this.canMoveBetweenTiles(x, y, x, y + dir.dy);

        if (!canMoveX || !canMoveY) {
          continue;
        }
      }

      neighbors.push(new PathNode(newX, newY));
    }

    return neighbors;
  }

  private canMoveBetweenTiles(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;

    const fromTile = this.tiles[fromY][fromX];
    const toTile = this.tiles[toY][toX];

    const isDoorFrom = this.doorTile && fromX === this.doorTile.x && fromY === this.doorTile.y;
    const isDoorTo = this.doorTile && toX === this.doorTile.x && toY === this.doorTile.y;

    if (isDoorFrom || isDoorTo) {
      return true;
    }

    if (dy < 0) {
      if (fromTile.hasNorthWall) {
        return false;
      }
    }

    if (dy > 0) {
      if (toTile.hasNorthWall) {
        return false;
      }
    }

    if (dx < 0) {
      if (fromTile.hasWestWall) {
        return false;
      }
    }

    if (dx > 0) {
      if (toTile.hasWestWall) {
        return false;
      }
    }

    return true;
  }

  private reconstructPath(endNode: PathNode): Vector3[] {
    const path: Vector3[] = [];
    let current: PathNode | null = endNode;

    while (current !== null) {
      const tile = this.tiles[current.y][current.x];
      path.unshift(new Vector3(current.x, current.y, tile.height));
      current = current.parent;
    }

    path.shift();

    return path;
  }

  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x <= this.maxX && y >= 0 && y <= this.maxY;
  }

  public static getDirection(fromX: number, fromY: number, toX: number, toY: number): number {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (dx === 0 && dy < 0) return 4;
    if (dx > 0 && dy < 0) return 3;
    if (dx > 0 && dy === 0) return 2;
    if (dx > 0 && dy > 0) return 1;
    if (dx === 0 && dy > 0) return 0;
    if (dx < 0 && dy > 0) return 7;
    if (dx < 0 && dy === 0) return 6;
    if (dx < 0 && dy < 0) return 5;

    return 0;
  }
}
