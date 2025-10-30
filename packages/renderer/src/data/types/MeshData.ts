export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface TileMesh {
  position: Vector3D;
  size: Vector3D;
  door?: boolean;
}

export interface WallMesh {
  position: Vector3D;
  length: number;
  direction: 'north' | 'west';
  corner: boolean;
}

export interface StairMesh {
  position: Vector3D;
  length: number;
  direction: 'north' | 'west' | 'east' | 'south';
  corners: number;
}

export enum CubeFace {
  TOP = 'TOP',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}
