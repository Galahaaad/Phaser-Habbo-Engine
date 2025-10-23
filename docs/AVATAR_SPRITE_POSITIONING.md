# Avatar Sprite Positioning & Offset System - Complete Technical Guide

## Overview

The Nitro renderer uses a sophisticated multi-layer offset system to position avatar sprites correctly. This document explains exactly how sprite offsets (-22, 50) from metadata are used to position sprites so that the feet are at the anchor point (the position where the avatar "stands").

## Key Concepts

### 1. The Anchor Point System

In Habbo/Nitro rendering, avatars have an invisible **anchor point** at their feet. This is where:
- The avatar's position (x, y) is placed on the game map
- The isometric grid positioning centers on
- The avatar stands relative to tiles

The challenge: Avatar sprites are rendered with varying dimensions and must be positioned so their feet align with this anchor point, not their top-left corner.

### 2. Multi-Layer Sprite Architecture

Avatars are NOT single sprites. They're composed of multiple layered sprites:
- **Head** (hd)
- **Body** (bd)
- **Left Hand** (lh)
- **Right Hand** (rh)
- **Legs** (lg)
- **Shoes** (sh)
- **Accessories** (various)

Each layer:
- Has its own sprite sheet texture
- Has its own width/height
- Has its own offset values
- Renders at a specific depth

## Offset System Breakdown

### Level 1: Canvas Offset

**File:** `AvatarCanvas.ts`

The avatar canvas (the overall render target) has an offset:

```typescript
export class AvatarCanvas {
    private _offset: Point;  // From metadata: (dx, dy)
    
    constructor(k: any, _arg_2: string) {
        this._offset = new Point(k.dx, k.dy);  // Example: Point(-22, 50)
    }
    
    public get offset(): Point {
        return this._offset;
    }
}
```

**What it does:** Shifts the entire avatar canvas within the render target. This is the metadata offset (-22, 50) you mentioned.

**Usage location (AvatarImage.ts, lines 352-360):**
```typescript
const point = part.regPoint.clone();

if(point) {
    point.x += avatarCanvas.offset.x;    // Add -22
    point.y += avatarCanvas.offset.y;    // Add 50
    
    point.x += avatarCanvas.regPoint.x;  // Add centering offset
    point.y += avatarCanvas.regPoint.y;  // Add centering offset
    
    partContainer.position.set(point.x, point.y);
}
```

### Level 2: Sprite Asset Offset

**File:** `AvatarImageCache.ts`, line 397

Each sprite asset has its own offset based on where it sits in the spritesheet:

```typescript
const offset = new Point(-(asset.x), -(asset.y));
```

This is the **spritesheet frame offset** - it tells you where in the texture the actual sprite data starts.

Example: If a head sprite starts at (100, 50) in the spritesheet, the offset is (-100, -50).

### Level 3: Animation Frame Offset (Direction Offsets)

**File:** `SpriteDataContainer.ts`

Animation data can specify direction-specific offsets for each sprite:

```typescript
export class SpriteDataContainer implements ISpriteDataContainer {
    private _dx: number[];  // Direction offset X
    private _dy: number[];  // Direction offset Y
    private _dz: number[];  // Direction offset Z (depth)
    
    public getDirectionOffsetX(direction: number): number {
        if(direction < this._dx.length) return this._dx[direction];
        return 0;
    }
    
    public getDirectionOffsetY(direction: number): number {
        if(direction < this._dy.length) return this._dy[direction];
        return 0;
    }
}
```

These adjustments move sprites slightly based on the avatar's facing direction. For example, the head might shift 2 pixels left when facing direction 2.

### Level 4: Action Frame Offset (Animation Frame Offsets)

**File:** `AnimationAction.ts`, line 105-122

This is the MOST IMPORTANT offset for dynamic positioning. Different animation frames have different offsets:

```typescript
public getFrameBodyPartOffset(frameId: number, frameCount: number, partId: string): Point {
    const frameIndex = (frameCount % this._frameIndexes.length);
    const frameNumber = this._frameIndexes[frameIndex];
    const offsets = this._bodyPartOffsets.get(frameNumber);
    
    if(!offsets) return AnimationAction.DEFAULT_OFFSET;  // Point(0, 0)
    
    const frameOffset = offsets.get(frameId);
    if(!frameOffset) return AnimationAction.DEFAULT_OFFSET;
    
    const offset = frameOffset.get(partId);
    if(!offset) return AnimationAction.DEFAULT_OFFSET;
    
    return offset;
}
```

**Critical:** During walking animations, each frame has a dx, dy value that shifts the sprite. Example walking animation:
- Frame 0: dx=0, dy=0
- Frame 1: dx=0, dy=-2 (body rises slightly)
- Frame 2: dx=0, dy=-1
- Frame 3: dx=0, dy=0

This creates the bobbing motion of walking.

### Level 5: Registration Point Offset

**File:** `AvatarImageBodyPartContainer.ts`, lines 68-76

The registration point is where the sprite is positioned FROM. It's calculated as:

```typescript
public get regPoint(): Point {
    const clone = this._regPoint.clone();
    
    clone.x += this._offset.x;  // Add dynamic offset from animation
    clone.y += this._offset.y;
    
    return clone;  // This is used to position the sprite
}
```

## Complete Offset Flow

Here's how all offsets combine in the rendering pipeline:

### Step 1: Collect Animation Frame Offset
**File:** `AvatarImageCache.ts`, lines 286-291

```typescript
const offset = this._structure.getFrameBodyPartOffset(
    _local_8,  // Action
    _local_5,  // Direction
    frameCount, // Current frame
    k           // Body part ID (e.g., "bd" for body)
);

_local_11.x += offset.x;
_local_11.y += offset.y;
_local_14.offset = _local_11;  // Apply to the body part container
```

### Step 2: Apply Direction Offsets
**File:** `AvatarImageCache.ts`, lines 212-221

```typescript
if(this._scale === AvatarScaleType.LARGE) {
    _local_11.x = _local_18.dx;  // Direction-specific frame offset
    _local_11.y = _local_18.dy;
} else {
    _local_11.x = (_local_18.dx / 2);  // Scale down for small avatars
    _local_11.y = (_local_18.dy / 2);
}
```

### Step 3: Create Asset Offset
**File:** `AvatarImageCache.ts`, lines 397-399

```typescript
const offset = new Point(-(asset.x), -(asset.y));

if(flipH) offset.x = (offset.x + ((this._scale === AvatarScaleType.LARGE) ? 65 : 31));
```

The asset offset accounts for:
- Where the sprite starts in the spritesheet
- Horizontal flipping adjustments

### Step 4: Render Body Part
**File:** `AvatarImageCache.ts`, lines 439-443

```typescript
const imageData = this.createUnionImage(this._unionImages, isFlipped);
const canvasOffset = ((this._scale === AvatarScaleType.LARGE) ? (this._canvas.height - 16) : (this._canvas.height - 8));
const offset = new Point(-(imageData.regPoint.x), (canvasOffset - imageData.regPoint.y));

if(isFlipped && (assetPartDefinition !== 'lay')) 
    offset.x = (offset.x + ((this._scale === AvatarScaleType.LARGE) ? 67 : 31));
```

This is where the **canvas offset** (-22, 50) is used! The imageData is positioned within the canvas using all accumulated offsets.

### Step 5: Position in Avatar Canvas
**File:** `AvatarImage.ts`, lines 352-371

```typescript
const point = part.regPoint.clone();

if(point) {
    // Apply canvas offset (the -22, 50)
    point.x += avatarCanvas.offset.x;
    point.y += avatarCanvas.offset.y;
    
    // Apply canvas registration point
    point.x += avatarCanvas.regPoint.x;
    point.y += avatarCanvas.regPoint.y;
    
    const partContainer = new NitroContainer();
    partContainer.addChild(partCacheContainer);
    
    // FINAL POSITION
    partContainer.position.set(point.x, point.y);
    
    container.addChild(partContainer);
}
```

## The Math: How (-22, 50) Works

### Canvas Dimensions (Large Avatar)

From the metadata:
- Canvas width: 128 pixels (example)
- Canvas height: 128 pixels
- Canvas offset: (-22, 50)

### Registration Point Calculation

**File:** `AvatarCanvas.ts`, lines 19-20

```typescript
if(_arg_2 == AvatarScaleType.LARGE)
    this._regPoint = new Point(((this._width - 64) / 2), 0);
else
    this._regPoint = new Point(((this._width - 32) / 2), 0);
```

For a 128x128 canvas:
- regPoint.x = (128 - 64) / 2 = 32
- regPoint.y = 0

### Final Position Example

Starting position of an avatar part: (0, 0)

1. Add canvas offset: (0 + (-22), 0 + 50) = (-22, 50)
2. Add regPoint: (-22 + 32, 50 + 0) = (10, 50)

This moves the sprite 10 pixels from the left edge and 50 pixels down, ensuring the feet align with the anchor point.

## Animation Frame Offsets in Action

### Walking Animation Example

When an avatar walks, animation frame offsets change:

```
Frame 0: offset = Point(0, 0)    → Body at normal height
Frame 1: offset = Point(0, -2)   → Body rises 2 pixels
Frame 2: offset = Point(0, -1)   → Body at mid-rise
Frame 3: offset = Point(0, 0)    → Body back to normal
```

**File:** `AvatarImageCache.ts`, lines 286-291

The offset is fetched PER FRAME:
```typescript
const offset = this._structure.getFrameBodyPartOffset(
    _local_8,     // Action (walk)
    _local_5,     // Direction (2, 3, etc)
    frameCount,   // Which frame? (0, 1, 2, 3, repeat)
    k             // Body part ("bd", "lg", etc)
);
```

Different body parts have different offsets:
- **Head (hd):** Might have different bobbing than legs
- **Legs (lg):** Might have bigger offset swings
- **Body (bd):** Intermediate offset changes

## Server Render Data

**File:** `AvatarImageCache.ts`, lines 401-426

The system also builds server render data for network transmission:

```typescript
if(renderServerData) {
    const spriteData = new RoomObjectSpriteData();
    
    spriteData.name = this._assets.getAssetName(assetName);
    spriteData.x = (-(offset.x) - 33);  // Negative of calculated offset
    spriteData.y = -(offset.y);
    spriteData.z = (this._serverRenderData.length * -0.0001);  // Depth ordering
    spriteData.width = asset.rectangle.width;
    spriteData.height = asset.rectangle.height;
    spriteData.flipH = flipH;
}
```

This is what gets sent over the network so other clients can render avatars.

## Implementation Summary for Phaser

When implementing avatar sprite positioning in Phaser:

1. **Get the canvas metadata** including offset (-22, 50) and dimensions
2. **For each body part sprite:**
   - Get the animation frame offset (dx, dy)
   - Get the spritesheet offset (where sprite sits in texture)
   - Get the direction-specific offset
   - Calculate registration point = regPoint + animation_offset + direction_offset
3. **Position the container:**
   - container.x = canvas.offset.x + registration_point.x + canvas.regPoint.x
   - container.y = canvas.offset.y + registration_point.y + canvas.regPoint.y
4. **For each frame:**
   - Fetch new animation frame offsets
   - Recalculate positions
   - Redraw (or update Phaser sprite positions)

## Critical Files Reference

| File | Purpose | Key Function |
|------|---------|---------------|
| `AvatarCanvas.ts` | Canvas dimensions & metadata offset | `get offset()` returns (-22, 50) |
| `AvatarImage.ts` | Combines all layers with correct offsets | `getImage()` builds final rendered avatar |
| `AvatarImageCache.ts` | Renders individual body parts with offsets | `getImageContainer()` applies all offsets |
| `AvatarImageBodyPartContainer.ts` | Stores sprite + registration point | `get regPoint()` returns final position |
| `AnimationAction.ts` | Stores per-frame offsets from animation data | `getFrameBodyPartOffset()` returns dx, dy |
| `SpriteDataContainer.ts` | Stores direction-specific offsets | `getDirectionOffsetX/Y()` |

## Debugging Tips

### Issue: Avatar feet not aligned with position

**Check:**
1. Is canvas offset being applied? (-22, 50)
2. Is canvas registration point calculated? (width/2 - 32)
3. Are animation frame offsets being fetched?
4. Is the anchor point at (0.5, 1) or (0, 0)?

### Issue: Animation offsets not applying

**Check:**
1. Is AnimationAction loaded with offset data?
2. Is `getFrameBodyPartOffset()` returning correct values?
3. Is the body part ID matching the animation data key?
4. Is frame counter incrementing correctly?

### Issue: Sprites flipping incorrectly

**Check:**
1. Is `isFlipped` correctly calculated based on direction?
2. Are flip offsets being applied? (+65 or +31 pixels)
3. Are hand/item sprites being handled specially?

---

## References

- **Source:** Nitro framework analysis
- **Canvas metadata:** From `assets/figuremap.json` or similar
- **Animation data:** From `assets/*.json` animation definitions
- **Implementation:** Avatar rendering pipeline in nitro-renderer

---

Generated: 2025-10-23
Scope: Complete avatar sprite positioning and offset system
