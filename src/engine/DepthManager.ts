import { IsometricEngine } from './IsometricEngine';
import { RoomObjectCategory } from '@data/types/RoomData';

export class DepthManager {
  public static updateObjectDepth(
    gameObject: Phaser.GameObjects.GameObject & { setDepth(value: number): any },
    tileX: number,
    tileY: number,
    tileZ: number = 0,
    category: RoomObjectCategory = RoomObjectCategory.FLOOR
  ): void {
    const baseDepth = IsometricEngine.calculateDepth(tileX, tileY, tileZ);
    const categoryOffset = category * 1000000;
    const finalDepth = categoryOffset + baseDepth;
    gameObject.setDepth(finalDepth);
  }

  public static sortByDepth<T extends { x: number; y: number; z?: number }>(objects: T[]): T[] {
    return objects.sort((a, b) => {
      const depthA = IsometricEngine.calculateDepth(a.x, a.y, a.z || 0);
      const depthB = IsometricEngine.calculateDepth(b.x, b.y, b.z || 0);
      return depthA - depthB;
    });
  }

  public static getCategoryLayerOffset(category: RoomObjectCategory): number {
    return category * 1000000;
  }
}
