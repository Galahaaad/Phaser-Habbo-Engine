# Nitro Isometric Renderer Analysis
## Complete Study of Room Rendering, Coordinate Conversion & Depth Sorting

---

## 1. PROJECT STRUCTURE OVERVIEW

The Nitro-React repository uses a **React wrapper** around the **@nitrots/nitro-renderer** package (v1.6.6), which is the actual rendering engine built with **PixiJS**.

### Key Directory Structure:
```
nitro-react/
├── src/
│   ├── api/
│   │   ├── nitro/
│   │   │   ├── room/                 # Room engine wrappers
│   │   │   ├── session/              # Session management
│   │   │   └── core/                 # Core Nitro instance
│   │   └── room/
│   │       └── widgets/              # Room widget utilities (positioning, info)
│   ├── hooks/
│   │   ├── rooms/
│   │   │   └── useRoom.ts           # CORE: Room initialization & geometry setup
│   │   └── rooms/widgets/            # Room widget hooks
│   ├── components/
│   │   └── room/
│   │       ├── RoomView.tsx          # Main room component
│   │       └── widgets/              # Room UI widgets
│   └── common/
│       └── utils/                    # UI utilities (not rendering math)
└── package.json                      # Depends on @nitrots/nitro-renderer
```

---

## 2. ISOMETRIC COORDINATE SYSTEM

### 2.1 Core Coordinate Concepts

The Nitro renderer uses a **3D isometric coordinate system** with three coordinate spaces:

#### **1. Tile Coordinates (Game Logic)**
- **X, Y**: Position on the room grid (0-100+ range typically)
- **Z**: Height/elevation on the tile (float value, represents stack height)
- **Format**: Used by room objects, pathfinding, and game logic
- **Example**: A furniture item at tile position (5, 10) with stack height 0.5

#### **2. Screen/Pixel Coordinates (Display)**
- **X, Y**: Pixel position on the screen/canvas
- **Format**: 2D integer coordinates (0, 0) is top-left
- **Used for**: UI positioning, mouse interaction, rendering bounds

#### **3. Camera/Geometry Coordinates**
- **Vector3d**: 3D vector used for camera position and object direction
- **Used for**: Camera angle calculation, direction vectors, animation angles

### 2.2 Key Data Structures

```typescript
// From @nitrots/nitro-renderer package
class Vector3d {
    x: number;
    y: number;
    z: number;
}

// Room Geometry (encapsulates isometric math)
class RoomGeometry {
    location: Vector3d;  // Camera position in world space
    
    // Constants
    SCALE_ZOOMED_IN = 32;      // Scale factor for zoomed view
    SCALE_ZOOMED_OUT = 16;     // Scale factor for zoomed out view
}

// Room Object positioning
interface RoomObject {
    x: number;                  // Tile X
    y: number;                  // Tile Y
    z: number;                  // Stack height (floating point)
    direction: number;          // Rotation (0-7 or 0-360)
}
```

### 2.3 Isometric Projection Formula

From the Nitro source (inferred from usage patterns):

```javascript
// Isometric projection from tile coordinates to screen coordinates
// The 30-degree isometric angle is fundamental to Habbo
const ISOMETRIC_ANGLE = 30 * (Math.PI / 180);  // 30 degrees in radians

// Camera setup with 30-degree angle:
const offset = 20;  // Distance offset from center
const x_center = (minX + maxX) / 2;
const y_center = (minY + maxY) / 2;

// Z-height calculation using isometric math:
const z = Math.sqrt((offset * offset) + (offset * offset)) * Math.tan(ISOMETRIC_ANGLE);
// Simplifies to: z = offset * Math.sqrt(2) * Math.tan(30°)
// Which is: z ≈ offset * 1.1547
```

**Key insight from useRoom.ts line 244-254:**
```typescript
const offset = 20;
x = (x + (offset - 1));
y = (y + (offset - 1));
const z = (Math.sqrt(((offset * offset) + (offset * offset))) * Math.tan(((30 / 180) * Math.PI)));
geometry.location = new Vector3d(x, y, z);
```

This shows the **30-degree isometric projection** is baked into the RoomGeometry.

---

## 3. COORDINATE CONVERSION (TILE ↔ SCREEN)

### 3.1 API Methods (Wrappers)

The React layer provides wrappers around the underlying Nitro-Renderer methods:

```typescript
// File: src/api/nitro/room/GetRoomObjectScreenLocation.ts
export const GetRoomObjectScreenLocation = (
    roomId: number, 
    objectId: number, 
    category: number, 
    canvasId = 1
) => {
    const point = GetRoomEngine().getRoomObjectScreenLocation(
        roomId, 
        objectId, 
        category, 
        canvasId
    );
    
    if(!point) return null;
    
    point.x = Math.round(point.x);
    point.y = Math.round(point.y);
    
    return point;  // Returns {x: number, y: number}
}

// File: src/api/nitro/room/GetRoomObjectBounds.ts
export const GetRoomObjectBounds = (
    roomId: number, 
    objectId: number, 
    category: number, 
    canvasId = 1
) => {
    const rectangle = GetRoomEngine().getRoomObjectBoundingRectangle(
        roomId, 
        objectId, 
        category, 
        canvasId
    );
    
    if(!rectangle) return null;
    
    rectangle.x = Math.round(rectangle.x);
    rectangle.y = Math.round(rectangle.y);
    
    return rectangle;  // Returns {x, y, width, height}
}
```

**Behind the scenes**, `GetRoomEngine()` returns the `IRoomEngine` interface from @nitrots/nitro-renderer, which contains the actual conversion logic.

### 3.2 Typical Conversion Flow

```
1. Get Room Object
   └─> GetRoomEngine().getRoomObject(roomId, objectId, category)
       Returns: RoomObject with x, y, z tile coordinates

2. Get Screen Location
   └─> GetRoomEngine().getRoomObjectScreenLocation(roomId, objectId, category)
       Converts: (x, y, z) → (screenX, screenY)
       
3. Get Bounding Box
   └─> GetRoomEngine().getRoomObjectBoundingRectangle(...)
       Returns: Rectangle {x, y, width, height} in screen coordinates
```

**The actual math is in the nitro-renderer package** and likely includes:
- Isometric projection matrix
- Camera position transformation
- Scale factor application (SCALE_ZOOMED_IN vs SCALE_ZOOMED_OUT)
- Sorting depth calculation

---

## 4. DEPTH/Z-INDEX SORTING SYSTEM

### 4.1 Key Concept: Depth-Based Rendering Order

Habbo rooms use **y-axis based depth sorting**, not traditional z-index. This creates the visual illusion of perspective in isometric view.

**Principle**: Objects further "back" in the room (higher Y tile coordinate) render on top.

### 4.2 Sorting Strategy (Inferred from Architecture)

```typescript
// Pseudo-code showing the depth sorting principle:

// Rooms render objects in this order:
1. Background (walls, floor)
2. Floor furniture (sorted by Y coordinate, then X)
   - Sort key: y_tile + (x_tile / 100)  // Y is primary
3. Avatars (sorted same as furniture)
   - Depth = avatar.y + (avatar.x / 100)
4. Wall furniture
5. Effects/particles

// Example depth calculation:
function getDepthValue(tileX: number, tileY: number): number {
    // Y coordinate is primary sort
    return tileY * 1000 + tileX;
}

// Objects with higher depth render on top
objects.sort((a, b) => getDepthValue(a.x, a.y) - getDepthValue(b.x, b.y));
```

### 4.3 Room Object Categories (Sorting Layers)

From the codebase, we see **RoomObjectCategory** enum with layers:

```typescript
// From @nitrots/nitro-renderer
enum RoomObjectCategory {
    FLOOR = 0,      // Floor furniture (lowest layer, sorted by Y)
    WALL = 1,       // Wall furniture (above floor)
    UNIT = 2,       // Avatars/users (same sorting as floor)
}
```

**Rendering order (back to front)**:
1. Room background
2. FLOOR furniture (sorted by Y-coordinate)
3. UNIT (avatars) - sorted by Y-coordinate
4. WALL furniture (typically doesn't need depth sort)

### 4.4 Stack Height (Z) Handling

When multiple objects occupy the same tile (X, Y), they use **Z (stack height)** for sub-sorting:

```typescript
// Stacking order on same tile
function getFullDepthKey(x: number, y: number, z: number): number {
    return y * 1000000 + x * 1000 + (z * 100);
}

// Example: Objects at tile (5, 10):
// - Object 1: z=0.0 → depth = 10,005,000
// - Object 2: z=0.5 → depth = 10,005,050
// - Object 3: z=1.0 → depth = 10,005,100
// They render in order: 1 → 2 → 3
```

---

## 5. ROOM RENDERING ENGINE INITIALIZATION

### 5.1 Main Setup Flow (useRoom.ts)

```typescript
// File: src/hooks/rooms/useRoom.ts - Lines 196-262

const useRoomState = () => {
    // ... state declarations ...
    
    useEffect(() => {
        if(!roomSession) return;
        
        // 1. Get instances
        const nitroInstance = GetNitroInstance();  // Main PixiJS app
        const roomEngine = GetRoomEngine();         // Rendering engine
        const roomId = roomSession.roomId;
        
        // 2. Setup canvas and renderer
        const width = Math.floor(window.innerWidth);
        const height = Math.floor(window.innerHeight);
        const renderer = nitroInstance.application.renderer;
        
        renderer.view.style.width = `${width}px`;
        renderer.view.style.height = `${height}px`;
        renderer.resolution = window.devicePixelRatio;
        renderer.resize(width, height);
        
        // 3. Get display object and canvas
        const displayObject = roomEngine.getRoomInstanceDisplay(
            roomId, 
            canvasId,      // Usually 1
            width, 
            height, 
            RoomGeometry.SCALE_ZOOMED_IN  // 32
        );
        const canvas = GetRoomEngine().getRoomInstanceRenderingCanvas(roomId, canvasId);
        
        // 4. Setup geometry (isometric camera)
        const geometry = (roomEngine.getRoomInstanceGeometry(roomId, canvasId) as RoomGeometry);
        
        if(geometry) {
            // Get room boundaries
            const minX = roomEngine.getRoomInstanceVariable<number>(roomId, RoomVariableEnum.ROOM_MIN_X) || 0;
            const maxX = roomEngine.getRoomInstanceVariable<number>(roomId, RoomVariableEnum.ROOM_MAX_X) || 0;
            const minY = roomEngine.getRoomInstanceVariable<number>(roomId, RoomVariableEnum.ROOM_MIN_Y) || 0;
            const maxY = roomEngine.getRoomInstanceVariable<number>(roomId, RoomVariableEnum.ROOM_MAX_Y) || 0;
            
            // Calculate center + offset
            let x = ((minX + maxX) / 2);
            let y = ((minY + maxY) / 2);
            
            const offset = 20;
            x = (x + (offset - 1));
            y = (y + (offset - 1));
            
            // CRITICAL: Isometric Z calculation
            const z = (Math.sqrt(((offset * offset) + (offset * offset))) * Math.tan(((30 / 180) * Math.PI)));
            
            // Set camera position
            geometry.location = new Vector3d(x, y, z);
        }
        
        // 5. Add to stage
        const stage = nitroInstance.application.stage;
        stage.addChild(displayObject);
        
        // 6. Handle resize
        window.addEventListener('resize', (event) => {
            // ... resize handler ...
        });
        
    }, [ roomSession ]);
}
```

### 5.2 Key Variables Used

```typescript
// From RoomVariableEnum (constants)
ROOM_MIN_X: number;     // Leftmost tile X
ROOM_MAX_X: number;     // Rightmost tile X
ROOM_MIN_Y: number;     // Top-most tile Y
ROOM_MAX_Y: number;     // Bottom-most tile Y
ROOM_WALL_TYPE: string; // Wall texture ID
ROOM_FLOOR_TYPE: string; // Floor texture ID
ROOM_LANDSCAPE_TYPE: string; // Landscape type
```

---

## 6. SPRITE RENDERING AND POSITIONING

### 6.1 Avatar Sprite Rendering

```typescript
// From: src/hooks/rooms/widgets/useChatWidget.ts - Lines 41-87

const getPetImage = (
    figure: string, 
    direction: number,  // 0-7 (8 directions) or 0-360 degrees
    scale: number = 64
) => {
    const figureData = new PetFigureData(figure);
    const typeId = figureData.typeId;
    
    // Get rendered image at specific direction
    const image = GetRoomEngine().getRoomObjectPetImage(
        typeId,
        figureData.paletteId,
        figureData.color,
        new Vector3d((direction * 45)),  // Direction as Vector3d angle
        scale,                            // Output scale (usually 64 or 128)
        null,
        false,
        0,
        figureData.customParts,
        posture                           // Standing, sitting, etc.
    );
    
    if(image) {
        existing = TextureUtils.generateImageUrl(image.data);
    }
    
    return existing;
}
```

**Key points**:
- Avatars have **8 directions** (0-7) with 45-degree angles
- Direction is encoded as `direction * 45` degrees
- Sprites are rendered at specific scales (usually 64 or 128 pixels)
- Postures affect sprite selection (stand, sit, wave, etc.)

### 6.2 Furniture Image Rendering

```typescript
// From: src/api/room/widgets/AvatarInfoUtilities.ts - Line 144

let roomObjectImage = GetRoomEngine().getRoomObjectImage(
    roomSession.roomId,
    objectId,
    category,
    new Vector3d(180),    // Fixed direction (front view)
    64,                   // Scale
    null                  // Additional params
);

if(!roomObjectImage.data || 
   roomObjectImage.data.width > 140 || 
   roomObjectImage.data.height > 200) {
    // Try smaller scale if too large
    roomObjectImage = GetRoomEngine().getRoomObjectImage(
        roomSession.roomId,
        objectId,
        category,
        new Vector3d(180),
        1,                 // Minimum scale
        null
    );
}
```

---

## 7. OBJECT POSITIONING IN UI WIDGETS

### 7.1 Dynamic Position Tracking (ObjectLocationView)

```typescript
// File: src/components/room/widgets/object-location/ObjectLocationView.tsx

const ObjectLocationView: FC<ObjectLocationViewProps> = ({
    objectId = -1,
    category = -1,
    noFollow = false,
    ...rest
}) => {
    const [ pos, setPos ] = useState<{ x: number, y: number }>({ x: -1, y: -1 });
    const elementRef = useRef<HTMLDivElement>();
    
    useEffect(() => {
        const getObjectLocation = () => {
            const roomSession = GetRoomSession();
            // Get bounding rectangle in screen coordinates
            const objectBounds = GetRoomObjectBounds(
                roomSession.roomId,
                objectId,
                category,
                1  // Canvas ID
            );
            
            return objectBounds;  // {left, top, width, height}
        }
        
        const updatePosition = () => {
            const bounds = getObjectLocation();
            
            if(!bounds || !elementRef.current) return;
            
            // Center horizontally, offset upward
            setPos({
                x: Math.round(((bounds.left + (bounds.width / 2)) - (elementRef.current.offsetWidth / 2))),
                y: Math.round((bounds.top - elementRef.current.offsetHeight) + 10)
            });
        }
        
        if(noFollow) {
            updatePosition();
        } else {
            // Update every frame using GetTicker()
            GetTicker().add(updatePosition);
        }
        
        return () => {
            if(remove) GetTicker().remove(updatePosition);
        }
    }, [ objectId, category, noFollow ]);
    
    return (
        <div 
            ref={elementRef}
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y
            }}
        >
            {children}
        </div>
    );
}
```

**Usage**: Positions UI elements (chat bubbles, names) above room objects.

---

## 8. TILE SYSTEM

### 8.1 Tile Data Structure

```typescript
// File: src/components/floorplan-editor/common/Tile.ts

export class Tile {
    private _height: string;        // Height value (usually "0.0" to "100.0")
    private _isBlocked: boolean;    // Walkable or blocked
    
    constructor(height: string, isBlocked: boolean) {
        this._height = height;
        this._isBlocked = isBlocked;
    }
    
    public get height(): string {
        return this._height;
    }
    
    public set height(height: string) {
        this._height = height;
    }
    
    public get isBlocked(): boolean {
        return this._isBlocked;
    }
}
```

### 8.2 Room Grid

The room is a 2D grid of tiles:
- **Typical size**: Variable (32x32, 64x64, or larger)
- **Each tile**: Can have a height value (for ramps, platforms)
- **Each tile**: Can be blocked (walls, obstacles)
- **Objects**: Positioned at (X, Y) with Z = tile_height + object_height

---

## 9. RENDERING PIPELINE SUMMARY

```
┌─────────────────────────────────────────────────────────┐
│  Room Data from Server                                   │
│  (Furniture, Avatars, Tiles)                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  RoomEngine (nitro-renderer)                             │
│  - Manages all room objects                              │
│  - Handles isometric projection                          │
│  - Performs depth sorting                                │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌─────┐ ┌──────┐ ┌────────┐
    │ 3D  │ │Screen│ │Depth  │
    │Tiles│ │Coords│ │Values │
    └─────┘ └──────┘ └────────┘
        │        │        │
        └────────┼────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │  Sorting by Depth       │
    │  (Y-coordinate primary) │
    └────────────┬────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │  Sprite Rendering            │
    │  (Correct Z-order based)      │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │  PixiJS Renderer             │
    │  (Hardware-accelerated)       │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │  Canvas / Screen             │
    │  (Final output)              │
    └──────────────────────────────┘
```

---

## 10. KEY FILES REFERENCE TABLE

| File Path | Purpose | Key Content |
|-----------|---------|------------|
| `src/hooks/rooms/useRoom.ts` | Room initialization | Geometry setup, camera position, 30° isometric math |
| `src/api/nitro/room/GetRoomObjectScreenLocation.ts` | Coordinate conversion wrapper | Tile → Screen conversion API |
| `src/api/nitro/room/GetRoomObjectBounds.ts` | Bounding box wrapper | Sprite bounds in screen space |
| `src/components/room/widgets/object-location/ObjectLocationView.tsx` | UI positioning | Dynamic tracker for object positions |
| `src/api/room/widgets/AvatarInfoUtilities.ts` | Object info extraction | Sprite generation, data retrieval |
| `src/hooks/rooms/widgets/useChatWidget.ts` | Chat bubble positioning | Avatar direction handling (8-direction system) |
| `src/components/floorplan-editor/common/Tile.ts` | Tile data | Tile height and blocking state |

---

## 11. CRITICAL FORMULAS FOR PHASER IMPLEMENTATION

### 11.1 Isometric Projection

```javascript
// Basic isometric projection (from Nitro)
const ISOMETRIC_ANGLE = 30 * (Math.PI / 180);  // 30 degrees

// Camera Z-height (from useRoom.ts):
const offset = 20;
const z = Math.sqrt(offset * offset + offset * offset) * Math.tan(ISOMETRIC_ANGLE);
// Approximation: z ≈ offset * 1.1547

// Typical projection formula (estimated):
function tileToScreen(tileX, tileY, tileZ, scale = 32) {
    // Isometric projection matrix (pseudo-code):
    const screenX = (tileX - tileY) * scale;
    const screenY = (tileX + tileY) * scale * 0.5 - tileZ * scale;
    return { screenX, screenY };
}
```

### 11.2 Depth Sorting

```javascript
// Depth calculation for sorting
function calculateDepth(x, y, z) {
    // Y is primary sort key (back to front)
    // X is secondary
    // Z is tertiary (stack height)
    return y * 1000 + x + (z / 1000);
}

// Sorting:
objects.sort((a, b) => {
    const depthA = calculateDepth(a.x, a.y, a.z);
    const depthB = calculateDepth(b.x, b.y, b.z);
    return depthA - depthB;
});
```

### 11.3 Direction System

```javascript
// Avatar directions in Habbo
const directions = {
    0: 'south',       // South/Down
    1: 'southwest',   // SW
    2: 'west',        // West/Left
    3: 'northwest',   // NW
    4: 'north',       // North/Up
    5: 'northeast',   // NE
    6: 'east',        // East/Right
    7: 'southeast'    // SE
};

// Angle from direction:
function directionToAngle(direction) {
    return direction * 45;  // 0°, 45°, 90°, etc.
}
```

---

## 12. IMPLEMENTATION NOTES FOR PHASER 3

### 12.1 Key Insights for Migration

1. **Coordinate Systems**:
   - Use 3 separate coordinate systems (Tile, Screen, Camera)
   - Always maintain conversions between them
   - Store all game objects in tile space, convert to screen on render

2. **Depth Sorting**:
   - Use Y-coordinate as PRIMARY sort key
   - Apply per-frame before rendering
   - Handles dynamic movement automatically

3. **Isometric Math**:
   - 30-degree angle is baked into all calculations
   - Use proper projection formulas
   - Test with various tile sizes (32, 48, 64 pixels)

4. **Camera System**:
   - RoomGeometry encapsulates all projection math
   - Camera position affects all coordinate calculations
   - Consider implementing a similar geometry class for Phaser

5. **Sprite Direction**:
   - 8-direction system (0-7) or full 360°
   - Multiply by 45 for radians conversion
   - Load appropriate sprite frame per direction

6. **Object Categories**:
   - Maintain separate render layers for FLOOR, UNIT, WALL
   - Use Phaser's depth property for sorting
   - Update depth on every position change

### 12.2 Performance Considerations

- **Depth recalculation**: Only when objects move
- **Sprite caching**: Load all direction frames upfront
- **Bounding boxes**: Cache and update only when needed
- **Vector3d math**: Minimize allocations, reuse objects

