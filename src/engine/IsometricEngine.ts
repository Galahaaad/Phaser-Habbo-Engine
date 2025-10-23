export class IsometricEngine {
  public static readonly ISOMETRIC_ANGLE = 30 * (Math.PI / 180);
  public static readonly TILE_SCALE = 32;
  public static readonly CAMERA_OFFSET = 20;

  public static tileToScreen(
    tileX: number,
    tileY: number,
    tileZ: number = 0,
    scale: number = IsometricEngine.TILE_SCALE
  ): { x: number; y: number } {
    const screenX = (tileX - tileY) * scale;
    const screenY = (tileX + tileY) * (scale * 0.5) - tileZ * scale;
    return { x: screenX, y: screenY };
  }

  public static screenToTile(
    screenX: number,
    screenY: number,
    scale: number = IsometricEngine.TILE_SCALE
  ): { x: number; y: number } {
    const tileX = (screenX / scale + screenY / (scale * 0.5)) / 2;
    const tileY = (screenY / (scale * 0.5) - screenX / scale) / 2;
    return { x: tileX, y: tileY };
  }

  public static calculateCameraZ(offset: number = IsometricEngine.CAMERA_OFFSET): number {
    return Math.sqrt(offset * offset + offset * offset) * Math.tan(IsometricEngine.ISOMETRIC_ANGLE);
  }

  // Y is primary, X secondary, Z tertiary for depth sorting
  public static calculateDepth(x: number, y: number, z: number = 0): number {
    return y * 1000 + x + (z / 1000);
  }

  public static directionToAngle(direction: number): number {
    return (direction % 8) * 45;
  }

  public static angleToDirection(angle: number): number {
    angle = ((angle % 360) + 360) % 360;
    return Math.round(angle / 45) % 8;
  }
}