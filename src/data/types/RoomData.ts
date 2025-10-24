import { Vector3 } from './Vector3';

export interface Tile {
  x: number;
  y: number;
  height: number;
  isBlocked: boolean;
  walkable: boolean;
}

export enum RoomObjectCategory {
  FLOOR = 0,
  WALL = 1,
  UNIT = 2
}

export interface RoomObject {
  id: number;
  position: Vector3;
  direction: number;
  category: RoomObjectCategory;
}

export interface FurniData extends RoomObject {
  typeId: number;
  state: number;
  width: number;
  length: number;
}

export interface AvatarData extends RoomObject {
  userId: number;
  username: string;
  figure: string;
  posture: 'std' | 'sit' | 'lay' | 'wlk';
  headDirection: number;
}

export interface RoomData {
  id: number;
  name: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxHeight: number;
  wallType: string;
  floorType: string;
  tiles: Tile[][];
  furniture: FurniData[];
  avatars: AvatarData[];
}