import { Vector3D } from './MeshData';

export enum StairDirection {
  NORTH = 0,
  EAST = 1,
  WEST = 2,
  SOUTH = 3
}

export type StairCornerType = 'left' | 'right' | 'front' | 'back';

export interface StairMesh {
  position: Vector3D;
  direction: StairDirection | null;
  length: number;
  corner: StairCornerType | null;
}
