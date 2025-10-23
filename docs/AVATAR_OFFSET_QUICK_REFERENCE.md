# Avatar Sprite Positioning - Quick Reference Guide

## TL;DR - How (-22, 50) Works

The metadata offset (-22, 50) is applied to position the entire avatar canvas within the render target. This offset + registration point + animation frame offsets ensure the avatar's feet align with the game position.

```
finalPosition.x = regPoint.x + canvas.offset.x + canvas.regPoint.x
finalPosition.y = regPoint.y + canvas.offset.y + canvas.regPoint.y

Example:
finalPosition.x = 50 + (-22) + 32 = 60
finalPosition.y = 100 + 50 + 0 = 150
```

## The 5-Level Offset System

### Level 1: Canvas Offset (METADATA)
**File:** `AvatarCanvas.ts`
```
offset: Point(-22, 50)  ← From asset metadata
```
**Purpose:** Main positioning of entire avatar canvas

### Level 2: Canvas Registration Point (CALCULATED)
**File:** `AvatarCanvas.ts` line 19-20
```typescript
regPoint = ((width - 64) / 2, 0)
// For 128px wide canvas: (32, 0)
```
**Purpose:** Center alignment of avatar

### Level 3: Animation Frame Offset (DYNAMIC)
**File:** `AnimationAction.ts` line 105-122
```typescript
offset = getFrameBodyPartOffset(action, direction, frameCount, partId)
// Returns Point(dx, dy) that changes per animation frame
// Example: Point(0, -2) to create bobbing motion
```
**Purpose:** Animate sprite positions (walk bobbing, etc.)

### Level 4: Direction Offset (DATA-DRIVEN)
**File:** `SpriteDataContainer.ts`
```typescript
directionOffset = Point(
    getDirectionOffsetX(direction),
    getDirectionOffsetY(direction)
)
// Small adjustment per facing direction
```
**Purpose:** Subtle position shift based on avatar direction

### Level 5: Asset Spritesheet Offset (TEXTURE META)
**File:** `AvatarImageCache.ts` line 397
```typescript
offset = Point(-(asset.x), -(asset.y))
// Tells where sprite starts in texture
```
**Purpose:** Account for spritesheet frame position

## Implementation Checklist for Phaser

- [ ] Load canvas metadata with offset (-22, 50) and dimensions
- [ ] Calculate canvas registration point: `(width/2 - 32, 0)` for large avatars
- [ ] For each body part:
  - [ ] Get animation frame offset via `AnimationAction.getFrameBodyPartOffset()`
  - [ ] Get direction-specific offset from sprite data
  - [ ] Calculate final position combining all offsets
  - [ ] Position sprite container at calculated position
- [ ] Update positions every animation frame as frame offsets change
- [ ] Handle horizontal flipping (+65 pixel adjustment for large avatars)

## Critical Code Snippets

### Getting Animation Frame Offset
```typescript
const offset = this._structure.getFrameBodyPartOffset(
    action,       // IActiveActionData
    direction,    // 0-7
    frameCount,   // current frame number
    bodyPartId    // 'bd', 'hd', 'lg', etc.
);
// Returns Point(dx, dy)
```

### Applying All Offsets
```typescript
// Step 1: Base position
let point = new Point(50, 100);

// Step 2: Add animation offset
const animOffset = getFrameBodyPartOffset(...);
point.x += animOffset.x;
point.y += animOffset.y;

// Step 3: Add canvas offset
point.x += avatarCanvas.offset.x;  // -22
point.y += avatarCanvas.offset.y;  // 50

// Step 4: Add canvas registration point
point.x += avatarCanvas.regPoint.x;  // 32
point.y += avatarCanvas.regPoint.y;  // 0

// Step 5: Position sprite
sprite.position = point;
```

### Animation Frame Data Structure
```typescript
interface IAnimationFrame {
    id: string;              // Frame identifier
    dx: number;              // X offset
    dy: number;              // Y offset
    bodyParts: {
        id: string;          // Body part ("bd", "hd", etc.)
        dx: number;          // Per-part offset X
        dy: number;          // Per-part offset Y
    }[];
}
```

## File Reference Map

```
Avatar Asset Loading:
  ├─ AvatarCanvas.ts ...................... Canvas dimensions & offset
  ├─ AvatarStructure.ts .................. Overall structure manager
  └─ AssetAliasCollection.ts ............. Asset name to texture mapping

Offset Calculation:
  ├─ AnimationAction.ts .................. Frame offset storage/retrieval
  ├─ SpriteDataContainer.ts ............. Direction offset data
  └─ AvatarImageBodyPartContainer.ts .... Registration point calculation

Rendering:
  ├─ AvatarImage.ts ..................... Combines all layers
  ├─ AvatarImageCache.ts ................ Renders individual body parts
  └─ AvatarImageBodyPartContainer.ts .... Stores rendered sprite + position
```

## Common Issues & Solutions

### Issue: Sprites misaligned (feet don't match position)
**Check:**
- Is canvas offset (-22, 50) being applied?
- Is canvas registration point calculated correctly?
- Are animation frame offsets being fetched for current frame?

### Issue: Walking animation doesn't bob
**Check:**
- Is animation frame offset fetched every frame?
- Is AnimationAction loaded with offset data?
- Is frame counter incrementing correctly?

### Issue: Avatar shifts when changing direction
**Check:**
- Are direction offsets being applied?
- Are canvas registration points correct for both directions?
- Is horizontal flip adjustment (+65/-31 pixels) applied?

### Issue: Flipped avatars (directions 4-7) positioned wrong
**Check:**
- Is horizontal flip offset applied: `offset.x += (isFlipped ? 65 : 0)`
- Are left/right handed items handled specially?
- Is texture flipping also applied?

## Animation Frame Offset Examples

### Standing (std.1) - Idle
```
Frame 0: dx=0, dy=0
Frame 1: dx=0, dy=0
Frame 2: dx=0, dy=0
Frame 3: dx=0, dy=0
```
No animation offsets - sprite stays still.

### Walking (mv.1) - Bobbing Motion
```
Frame 0: dx=0,  dy=0   ← Normal
Frame 1: dx=0,  dy=-2  ← Rise
Frame 2: dx=0,  dy=-3  ← Peak rise
Frame 3: dx=0,  dy=-2  ← Fall
Frame 4: dx=0,  dy=0   ← Normal
Frame 5: dx=0,  dy=2   ← Dip
Frame 6: dx=0,  dy=1   ← Recover
Frame 7: dx=0,  dy=0   ← Normal (back to Frame 0)
```
Y-offset changes create vertical bobbing.

### Sitting (sit.1)
```
Frame 0: dx=0, dy=10   ← Body drops 10px
Frame 1: dx=0, dy=10
Frame 2: dx=0, dy=10
```
Fixed offset shows sitting lowered.

## Debugging Timeline

1. **Load Assets** → Check canvas metadata has offset (-22, 50)
2. **Create Avatar** → Verify canvas registration point calculated
3. **Render Frame 0** → Check sprite positioned using offsets
4. **Animate** → Verify frame offsets change per frame
5. **Change Direction** → Confirm direction-specific offsets applied
6. **Start Walking** → Check animation frame offset applies

## Performance Notes

- **Cache the results:** Don't recalculate offsets every frame if not needed
- **Batch updates:** Combine offset calculations with texture atlas queries
- **Direction changes:** Are rare, so special-case logic is OK
- **Animation timing:** Frame offset updates must sync with animation frame counter

## Related Research Documents

- **AVATAR_SPRITE_POSITIONING.md** - Complete technical deep-dive
- **AVATAR_OFFSET_DIAGRAMS.md** - Visual diagrams and examples
- **NITRO_CODE_REFERENCE.md** - Actual Nitro code snippets
- **NITRO_AVATAR_MOVEMENT_ANALYSIS.md** - Movement system analysis

---

**Key Takeaway:** The (-22, 50) offset is the starting point. Layer on:
1. Canvas registration point
2. Animation frame offsets
3. Direction-specific offsets
4. Asset spritesheet positions

These combine to position each sprite correctly so feet align with the anchor point.

---

Generated: 2025-10-23
For: Phaser Avatar Renderer Implementation
