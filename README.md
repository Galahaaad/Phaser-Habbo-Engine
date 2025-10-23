# Phaser Habbo Renderer

Building a Habbo-style isometric room renderer with Phaser 3 instead of the usual PixiJS. Because why not?

![Demo](./docs/demos/demo.gif)

## What works right now

The core engine is pretty solid:
- 30° isometric projection (like the real Habbo)
- Real Habbo avatar sprites with proper animations
- Walking in 8 directions with smooth transitions
- A* pathfinding that doesn't cut corners
- Depth sorting so things render in the right order
- Floor tiles with different patterns
- Walls that actually look like walls
- Click anywhere to walk there
- Camera pan and zoom

## Getting started

```bash
npm install
npm run dev
```

Open your browser and you should see a room with an avatar. Click anywhere to make them walk.

## Tech stack

- Phaser 3 for the game engine
- TypeScript because types are nice
- Vite for fast dev workflow

## Project structure

The code is in `src/`:
- `engine/` - Isometric math and depth sorting
- `entities/` - Avatar and furniture classes
- `systems/` - Pathfinding, asset loading, renderers
- `scenes/` - Phaser scenes (boot, loader, room)