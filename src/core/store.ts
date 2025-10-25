import { create } from 'zustand';

export interface AvatarPosition {
  x: number;
  y: number;
  z: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  roomId: string;
  roomName: string;

  avatarPosition: AvatarPosition;
  isAvatarMoving: boolean;

  chatMessages: ChatMessage[];
  isChatFocused: boolean;

  setRoomId: (id: string) => void;
  setRoomName: (name: string) => void;

  setAvatarPosition: (position: AvatarPosition) => void;
  setAvatarMoving: (moving: boolean) => void;

  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  setChatFocused: (focused: boolean) => void;

  navigateToRoom: (roomId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomId: '',
  roomName: '',

  avatarPosition: { x: 0, y: 0, z: 0 },
  isAvatarMoving: false,

  chatMessages: [],
  isChatFocused: false,

  setRoomId: (id) => set({ roomId: id }),
  setRoomName: (name) => set({ roomName: name }),

  setAvatarPosition: (position) => set({ avatarPosition: position }),
  setAvatarMoving: (moving) => set({ isAvatarMoving: moving }),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message].slice(-100)
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  setChatFocused: (focused) => set({ isChatFocused: focused }),

  navigateToRoom: (roomId) => {
    set({ roomId, chatMessages: [] });
    console.log(`[Store] Navigating to room: ${roomId}`);
  }
}));
