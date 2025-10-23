# Architecture du Phaser-Renderer

## Vue d'ensemble

Ce document décrit l'architecture du Phaser-Renderer, un moteur de rendu isométrique pour client Habbo basé sur Phaser 3 et TypeScript.

## Structure des dossiers

```
phaser-renderer/
├── src/
│   ├── main.ts                   # Point d'entrée, configuration Phaser
│   ├── engine/                   # Moteur de rendu isométrique
│   │   ├── IsometricEngine.ts    # Conversion coordonnées tile ↔ screen
│   │   └── DepthManager.ts       # Gestion du depth sorting (z-index)
│   ├── entities/                 # Entités du jeu (TODO)
│   │   ├── Avatar.ts             # Avatars avec animations
│   │   ├── Furni.ts              # Meubles avec états
│   │   └── Tile.ts               # Tuiles du sol
│   ├── scenes/                   # Scènes Phaser
│   │   ├── BootScene.ts          # Initialisation
│   │   ├── LoaderScene.ts        # Chargement des assets
│   │   └── RoomScene.ts          # Visualisation de room
│   ├── systems/                  # Systèmes (TODO)
│   │   ├── AssetLoader.ts        # Chargement assets Habbo
│   │   ├── PathFinder.ts         # Pathfinding A*
│   │   └── AnimationManager.ts   # Gestion animations
│   └── data/
│       └── types/                # Types TypeScript
│           ├── Vector3.ts        # Vecteur 3D (x, y, z)
│           └── RoomData.ts       # Interfaces Room/Furni/Avatar
├── public/
│   └── assets/                   # Assets Habbo (spritesheets, JSON)
├── references/
│   └── nitro-react/              # Référence Nitro pour implémentation
└── docs/
    ├── architecture.md           # Ce document
    └── NITRO_ANALYSIS.md         # Analyse complète de Nitro
```

## Composants principaux

### 1. IsometricEngine

**Responsabilité** : Conversion entre coordonnées tile (logique) et screen (affichage)

**Formules clés** :
```typescript
// Tile → Screen (projection isométrique 30°)
screenX = (tileX - tileY) * scale
screenY = (tileX + tileY) * scale * 0.5 - tileZ * scale

// Screen → Tile (inverse)
tileX = (screenX / scale + screenY / (scale * 0.5)) / 2
tileY = (screenY / (scale * 0.5) - screenX / scale) / 2
```

**Constantes** :
- `ISOMETRIC_ANGLE = 30°` (angle isométrique Habbo)
- `TILE_SCALE = 32` (pixels par tile par défaut)
- `CAMERA_OFFSET = 20` (offset caméra)

### 2. DepthManager

**Responsabilité** : Gestion du depth sorting pour l'ordre de rendu

**Formule de depth** :
```typescript
depth = Y * 1000 + X + (Z / 1000)
```

**Principe** : Y est la clé primaire (back-to-front), X secondaire, Z tertiaire

**Catégories d'objets** :
- `FLOOR (0)` : Meubles au sol (depth 0-999,999)
- `UNIT (2)` : Avatars (depth 1,000,000-1,999,999)
- `WALL (1)` : Meubles muraux (depth 2,000,000+)

### 3. Scenes Phaser

#### BootScene
- Initialisation globale
- Configuration de base
- Transition vers LoaderScene

#### LoaderScene
- Chargement des assets (spritesheets, JSON)
- Affichage de la barre de progression
- Transition vers RoomScene

#### RoomScene
- Rendu de la room isométrique
- Contrôles caméra (zoom, pan)
- Debug overlay avec infos en temps réel

### 4. Types de données

#### Vector3
```typescript
class Vector3 {
  x: number;  // Position X ou angle
  y: number;  // Position Y
  z: number;  // Position Z (hauteur de stack)
}
```

#### RoomData
```typescript
interface RoomData {
  id: number;
  name: string;
  minX, maxX, minY, maxY: number;  // Dimensions
  wallType, floorType: string;      // IDs textures
  tiles: Tile[][];                  // Grille 2D
  furniture: FurniData[];
  avatars: AvatarData[];
}
```

#### Tile
```typescript
interface Tile {
  x, y: number;         // Position dans la grille
  height: number;       // Hauteur Z (escaliers, plateformes)
  isBlocked: boolean;   // Tile bloquée ou marchable
}
```

## Système de coordonnées

### 3 espaces de coordonnées

1. **Tile Space** (logique du jeu)
   - X, Y : Position dans la grille (0-100+)
   - Z : Hauteur de stack (float)
   - Utilisé pour : pathfinding, collision, logique

2. **Screen Space** (affichage)
   - X, Y : Position en pixels à l'écran
   - Origine (0,0) = coin haut-gauche
   - Utilisé pour : rendu, UI, interaction souris

3. **Camera Space** (vue)
   - Position et angle de la caméra
   - Zoom, scrollX, scrollY
   - Appliqué au rendering final

### Conversions

```
Tile (5, 10, 0.5)
    ↓ tileToScreen()
Screen (160, 240)
    ↓ screenToTile()
Tile (5, 10)
```

## Système de direction (8 directions)

```
     4 (North)
   5   ↑   3
     \ | /
6 ←----+----→ 2
     / | \
   7   ↓   1
     0 (South)

Direction → Angle
0 → 0°   (Sud)
1 → 45°  (SO)
2 → 90°  (Ouest)
3 → 135° (NO)
4 → 180° (Nord)
5 → 225° (NE)
6 → 270° (Est)
7 → 315° (SE)
```

## Ordre de rendu

```
1. Background (murs, sol)
2. FLOOR furniture (triés par Y, X, Z)
3. UNIT avatars (triés par Y, X, Z)
4. WALL furniture
5. Effets/particules
```

**Important** : Le depth est recalculé à chaque déplacement d'objet

## Prochaines étapes

### MVP (Phase 1)
- ✅ Setup projet Vite + Phaser + TypeScript
- ✅ IsometricEngine avec formules Nitro
- ✅ DepthManager pour sorting
- ✅ RoomScene avec room 10x10 hardcodée
- ✅ Contrôles caméra (zoom, pan)
- 🚧 AssetLoader pour assets Habbo
- 🚧 Avatar avec animations de base
- 🚧 Pathfinding visuel

### Phase 2
- Furni avec drag & drop
- Animations avatar (walk, sit, wave)
- Room editor
- Export room data

## Références

- **Nitro Analysis** : Voir `NITRO_ANALYSIS.md` pour détails complets
- **Phaser 3 Docs** : https://docs.phaser.io/
- **Angle isométrique** : 30° (standard Habbo/Nitro)

## Notes de performance

- Recalculer depth uniquement quand objets bougent
- Charger tous les frames de direction en avance
- Cacher bounding boxes pour UI
- Réutiliser Vector3 plutôt que créer à chaque frame