# Avatar Offset System - Visual Diagrams

## 1. Multi-Level Offset Application Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Animation Frame Data                                                │
│ (ActionDefinition + AnimationAction)                               │
│ Contains: dx, dy offsets per frame per body part                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Get Frame Offset                                            │
│ offset = getFrameBodyPartOffset(                                   │
│     action,        // 'mv' for walk, 'std' for stand               │
│     direction,     // 0-7 (compass direction)                      │
│     frameCount,    // current animation frame                      │
│     bodyPartId     // 'bd', 'hd', 'lg', etc                        │
│ );                                                                  │
│ Result: Point(dx, dy) - e.g., Point(0, -2)                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Apply Animation Layer Offset                                │
│ offset += direction-specific offset (from SpriteDataContainer)     │
│ offset += asset spritesheet offset (from texture meta)              │
│ Result: Combined offset for this sprite                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Calculate Registration Point                                │
│ regPoint = baseRegPoint + offset                                   │
│ This becomes the position where sprite is rendered                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Apply Canvas Offsets                                        │
│ finalPos.x = regPoint.x + canvas.offset.x (-22)                    │
│ finalPos.y = regPoint.y + canvas.offset.y (50)                     │
│ finalPos += canvas.regPoint (centering offset)                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FINAL: Sprite Position in Avatar Canvas                             │
│ partContainer.position.set(finalPos.x, finalPos.y)                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Coordinate System - How (-22, 50) Positions a Sprite

### Canvas Layout (128x128 pixels)

```
Standing Avatar with Direction 2 (facing down-right)

       Canvas Bounds (128x128)
    ┌─────────────────────────────┐
    │                             │
    │  ▲ offset.y = 50 (down)     │  ← Metadata offset starts here
    │  │                          │
    │  ├─► offset.x = -22 (left)  │
    │  │                          │
    │  │                          │
    │  │   ┌─────────────┐        │  ← Head sprite positioned here
    │  │   │    HEAD     │        │     After applying offsets
    │  │   ├─────────────┤        │
    │  │   │   BODY      │        │
    │  │   │  / \        │        │
    │  │   │/   \       │        │
    │  │   └─────────────┘        │
    │  │   ╳ ANCHOR POINT         │  ← Feet align here
    │  └──────────────────────────┘
    │
    └─────────────────────────────┘
```

### Step-by-Step Position Calculation

```
Initial sprite origin: (0, 0) - top-left

Step 1: Register point (from body part container)
  regPoint = Point(50, 100)

Step 2: Add canvas offset (metadata: -22, 50)
  x = 50 + (-22) = 28
  y = 100 + 50 = 150

Step 3: Add canvas registration point (width/2 - 32, 0)
  For 128-wide canvas: (128/2 - 32, 0) = (32, 0)
  x = 28 + 32 = 60
  y = 150 + 0 = 150

FINAL: Sprite positioned at (60, 150) ✓
        Feet align with tile anchor point
```

## 3. Walking Animation - Frame Offset Changes

### Frame-by-Frame Y Position During Walk

```
Animation "mv.1" (walking) - Body Part Bobbing

Frame    Offset.dy   Visual
────────────────────────────────
  0        0         ▌ NORMAL
  1       -2         ▊ RISE
  2       -3         ▋ PEAK
  3       -2         ▊ FALL
  4        0         ▌ NORMAL
  5        2         ▄ DIP
  6        1         ▃ RECOVER
  7        0         ▌ NORMAL
  
Total 8 frames = complete walking cycle

Each frame's offset is fetched during rendering:
  finalOffset = baseOffset + frame_offset[frameNumber]
  
This creates smooth bobbing motion as avatar walks.
```

## 4. Multi-Layer Sprite Assembly

### Body Parts Stacking (Back to Front)

```
Direction 2 (facing down-right)
Depth ordering from back to front:

Depth │ Body Part     │ Description
──────┼───────────────┼──────────────────────
 0    │ Hair (ha)     │ Rendered first (back)
 1    │ Head (hd)     │
 2    │ Shoes (sh)    │
 3    │ Legs (lg)     │
 4    │ Body (bd)     │
 5    │ Left Hand (lh)│
 6    │ Right Hand (rh)
 7    │ Items/Carry   │ Rendered last (front)

Each has own texture + own offsets!
```

### Individual Sprite Structure

```
For Head (hd) Sprite:

┌──────────────────────────────────────────────┐
│ Animation Data (hd offsets)                  │
│ Frame 0: dx=0,   dy=0                        │
│ Frame 1: dx=-1,  dy=0                        │
│ Frame 2: dx=-2,  dy=0   (head turns)         │
│ Frame 3: dx=-1,  dy=0                        │
│ Frame 4: dx=0,   dy=0                        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Direction Offsets                            │
│ Dir 0: dx=1, dy=0                            │
│ Dir 1: dx=0, dy=0                            │
│ Dir 2: dx=-1, dy=0   ← heading down-right    │
│ Dir 3: dx=0, dy=0                            │
│ ... etc                                      │
└──────────────────────────────────────────────┘

Combined for Frame X, Direction 2:
totalOffset = animation_offset + direction_offset
            = Point(-2, 0) + Point(-1, 0)
            = Point(-3, 0)
```

## 5. Complete Rendering Pipeline - Real Numbers

### Example: Standing Avatar, Direction 2

```
METADATA (from assets):
Canvas:
  width: 128
  height: 128
  offset: Point(-22, 50)    ← The famous offset!
  
Body Part (hd - head):
  baseRegPoint: Point(50, 40)
  Animation: "std.1" (standing)
    Frame 0: offset = Point(0, 0)
  Direction: 2
    offset = Point(0, 0)
  Texture offset: Point(-10, -5)


STEP 1: Get animation offset
  animOffset = Point(0, 0)

STEP 2: Get direction offset
  dirOffset = Point(0, 0)

STEP 3: Calculate registration point
  regPoint = baseRegPoint + animOffset + dirOffset
          = Point(50, 40) + Point(0, 0) + Point(0, 0)
          = Point(50, 40)

STEP 4: Apply canvas offset
  x = 50 + (-22) = 28
  y = 40 + 50 = 90

STEP 5: Apply canvas registration point
  canvasRegPoint = (128/2 - 32, 0) = (32, 0)
  x = 28 + 32 = 60
  y = 90 + 0 = 90

FINAL: Head sprite at (60, 90) ✓
```

### Same Avatar, Walking, Frame 2

```
Same conditions, but:
  Action: "mv.1" (walking)
    Frame 2: offset = Point(0, -3)   ← Body rises!


STEP 1: Get animation offset
  animOffset = Point(0, -3)

STEP 2: Get direction offset
  dirOffset = Point(0, 0)

STEP 3: Calculate registration point
  regPoint = baseRegPoint + animOffset + dirOffset
          = Point(50, 40) + Point(0, -3) + Point(0, 0)
          = Point(50, 37)    ← Higher up!

STEP 4: Apply canvas offset
  x = 50 + (-22) = 28
  y = 37 + 50 = 87

STEP 5: Apply canvas registration point
  x = 28 + 32 = 60
  y = 87 + 0 = 87

FINAL: Head sprite at (60, 87) ✓
       3 pixels higher than standing!
       This creates the bobbing motion.
```

## 6. Asset Spritesheet Offset Example

### Head Spritesheet

```
Spritesheet "h_hd_2_0.png" (head, direction 2, frame 0)

┌────────────────────────────────────────────┐
│ 256x256 Spritesheet                        │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────┐                          │
│  │              │  ← Actual sprite data    │
│  │   ┌─────┐    │     starts at (10, 5)   │
│  │   │HEAD │    │     in the spritesheet  │
│  │   └─────┘    │                          │
│  └──────────────┘  width: 32, height: 40  │
│                                            │
└────────────────────────────────────────────┘

Asset metadata:
  x: 10        ← Position in spritesheet
  y: 5
  width: 32
  height: 40

Asset offset applied to sprite:
  offset.x = -(10) = -10
  offset.y = -(5) = -5
  
This tells renderer: "Sprite actual content starts 10px
from left and 5px from top within the texture rectangle"
```

## 7. Direction-Specific Offset Impact

### Head Turn Animation - Different Directions

```
Frame 0 across directions (standing, not walking):

Dir 0 (South)    Dir 2 (Southeast)  Dir 4 (East)
    │                 │                │
    ▼                 ▼                ▼
  ┌───┐             ┌───┐           ┌───┐
  │ O │             │  O│           │   O
  │ │ │             │  │            │  /
  └───┘             └───┘           └───┘
offset=(0,0)    offset=(2,0)    offset=(4,0)
            Increasingly offset right as facing right


Dir 6 (West)     Dir 7 (Northwest)
    │                │
    ▼                ▼
  ┌───┐             ┌───┐
  │O  │             │O  │
  │ │ │             │ \ │
  └───┘             └───┘
offset=(-4,0)   offset=(-2,0)
```

## 8. Canvas Registration Point Calculation

### Why We Need Canvas RegPoint

```
Problem: Avatar sprite can be different widths
Solution: Center it using registration point

Small Avatar (64px wide):
  regPoint = (64/2 - 32, 0) = (0, 0)
  
Normal Avatar (128px wide):
  regPoint = (128/2 - 32, 0) = (32, 0)
  
Large Avatar (160px wide):
  regPoint = (160/2 - 32, 0) = (48, 0)

This centers the avatar in its canvas,
so the (-22, 50) offset works relative to the center.
```

## 9. Animation Frame Counter Update Timing

### Frame Counter Progression During Walk

```
Game Time    Frame Counter    Visual Animation
──────────────────────────────────────────────
   0ms           0            Frame 0 (standing start)
 100ms           0            Frame 0
 200ms           1            Frame 1 (rises)
 300ms           2            Frame 2 (peak rise)
 400ms           2            Frame 2
 500ms           3            Frame 3 (falling)
 600ms           4            Frame 4 (normal)
 700ms           4            Frame 4
 800ms           5            Frame 5 (dip down)
 900ms           6            Frame 6 (rise)
1000ms           7            Frame 7
1100ms           0            Frame 0 (repeat cycle)

Each frame offset applied during rendering creates smooth bobbing.
```

## 10. Flip Offset Adjustment

### Horizontal Flip Adjustments

```
Direction 0-3: Normal (left side of avatar visible)
Direction 4-7: Flipped (right side of avatar visible)

When flipping left-to-right:
  Existing offset = -22
  Flip adjustment = +65 (for large avatar)
  New offset = -22 + 65 = 43
  
This ensures mirrored sprites align properly.


Visual comparison:

Normal (Dir 0)        Flipped (Dir 4)
   │                     │
   ▼                      ▼
 ┌───┐  flip          ┌───┐
 │ O │  ──────→       │ O │
 │ │ │               │ │ │  
 └───┘                └───┘
offset=-22          offset=43
```

---

## Summary Table: All Offsets at a Glance

| Offset Type | Value | Source | Purpose |
|------------|-------|--------|---------|
| Canvas Offset | (-22, 50) | Metadata | Main positioning in render target |
| Canvas RegPoint | (32, 0) | Calculated | Center alignment |
| Animation Frame Offset | Variable (0-10) | Animation data | Bobbing during walk |
| Direction Offset | -2 to +2 | Sprite data | Slight shift per direction |
| Asset Spritesheet | Negative of xy | Texture meta | Tell renderer where sprite starts |
| Flip Adjustment | +65 or +31 | Calculated | Correct alignment when mirrored |

---

Generated: 2025-10-23
Scope: Visual diagrams of avatar offset system
