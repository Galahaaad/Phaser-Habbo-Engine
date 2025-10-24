export class IsometricEngine {
  public static readonly TILE_WIDTH = 64;
  public static readonly TILE_HEIGHT = 32;
  public static readonly HALF_TILE_WIDTH = 32;
  public static readonly HALF_TILE_HEIGHT = 16;
  public static readonly TILE_SCALE = 32;

  public static tileToScreen(
    tileX: number,
    tileY: number,
    tileZ: number = 0
  ): { x: number; y: number } {
    const screenX = 32 * tileX - 32 * tileY;
    const screenY = 16 * tileX + 16 * tileY - 32 * tileZ;
    return { x: screenX, y: screenY };
  }

  public static tileToScreenWithSize(
    x: number,
    y: number,
    z: number,
    sizeX: number,
    sizeY: number
  ): { x: number; y: number } {
    return {
      x: 32 * x - 32 * (y + sizeY - 1),
      y: 16 * x + 16 * (y + sizeY - 1) - 32 * z
    };
  }

  public static screenToTile(
    screenX: number,
    screenY: number
  ): { x: number; y: number } {
    const localX = Math.round(screenX / 64 + screenY / 32);
    const localY = Math.round(screenY / 32 - screenX / 64 + 0.5);
    return { x: localX, y: localY };
  }

  public static calculateDepth(x: number, y: number, z: number, priority: number = 6): number {
    const COMPARABLE_X_Y = 1000000;
    const PRIORITY_MULTIPLIER = 10000000;

    return (x ** 2 + y + z * 2) * COMPARABLE_X_Y + PRIORITY_MULTIPLIER * priority;
  }

  public static calculateWallDepth(x: number, y: number, priority: number = 6): number {
    const COMPARABLE_X_Y = 1000000;
    const PRIORITY_MULTIPLIER = 10000000;

    return (x + y) * COMPARABLE_X_Y + PRIORITY_MULTIPLIER * priority;
  }

  public static directionToAngle(direction: number): number {
    return (direction % 8) * 45;
  }

  public static angleToDirection(angle: number): number {
    angle = ((angle % 360) + 360) % 360;
    return Math.round(angle / 45) % 8;
  }
}
