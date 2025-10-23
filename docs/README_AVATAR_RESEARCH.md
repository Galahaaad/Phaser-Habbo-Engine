# Avatar Movement & Animation Research - Complete Documentation

This directory contains comprehensive analysis of how the Nitro framework handles avatar movement and animations.

## Generated Documents

### 1. NITRO_AVATAR_MOVEMENT_ANALYSIS.md (350 lines)
**Complete technical analysis** with detailed explanations of:
- Avatar action states and posture system
- Movement flow and interpolation logic
- Animation frame system
- Sprite rendering pipeline
- Timing values and constraints
- Critical insights for implementation

**Read this first** for a complete understanding of the system.

### 2. NITRO_KEY_FINDINGS.md
**Quick reference guide** with:
- Standing vs Walking animation comparison
- Animation frame update flow diagram
- Position interpolation details
- Critical timing values summary
- Common implementation issues to avoid
- Key variables to track
- Absolute file paths to all critical files

**Use this** for quick lookups and during development.

### 3. NITRO_CODE_REFERENCE.md
**Actual code snippets** from the Nitro codebase showing:
1. Posture state changes (AvatarAction.ts constants)
2. Position interpolation (MovingObjectLogic.ts)
3. Animation frame updates (AvatarVisualization.ts)
4. Avatar image animation management (AvatarImage.ts)
5. Animation lookup and frame selection (Animation.ts)
6. Sprite rendering with frame data (AvatarVisualization.ts)
7. Model update handling (AvatarVisualization.ts)
- Complete call chain diagram for movement

**Use this** for implementation reference with exact line numbers and code.

---

## Key Insights Summary

### The Walking Animation ('mv') vs Standing Animation ('std')

When an avatar moves:
1. Posture changes from `'std'` to `'mv'`
2. This triggers loading the `"mv.1"` animation instead of `"std.1"`
3. Animation frames cycle through the walking sequence
4. Position interpolates smoothly over 500ms between tiles

### Critical Timing

- **Movement Duration:** 500ms per tile (non-configurable in default Nitro)
- **Animation Frame Update:** Every 2 update cycles (20ms intervals if updates are 41ms)
- **Position Update:** Every 41ms (UPDATE_TIME_INCREASER)
- **Frame Counter Increment:** Every 2 position updates

### The Decoupling Issue

Animation frames update LESS frequently than position updates:
- Position: Updated every cycle (~41ms)
- Animation: Updated every 2 cycles (~82ms)

This can cause animation/movement mismatch if not carefully synchronized.

### File Structure

All critical files are in `/references/nitro-renderer/src/`:
- **Logic:** `nitro/room/object/logic/avatar/AvatarLogic.ts`
- **Visualization:** `nitro/room/object/visualization/avatar/AvatarVisualization.ts`
- **Animation Management:** `nitro/avatar/AvatarImage.ts`
- **Movement:** `nitro/room/object/logic/MovingObjectLogic.ts`
- **Message Handling:** `nitro/room/RoomMessageHandler.ts`

---

## How to Use This Research

### For Understanding the System
1. Start with NITRO_AVATAR_MOVEMENT_ANALYSIS.md for complete overview
2. Reference NITRO_KEY_FINDINGS.md for specific patterns
3. Use NITRO_CODE_REFERENCE.md for exact implementations

### For Implementation
1. Map the movement states in your renderer
2. Ensure animation frames sync with movement timing
3. Implement position interpolation over 500ms
4. Handle posture transitions (std ↔ mv)
5. Manage frame counter increments correctly

### For Debugging
1. Check that posture is changing (FIGURE_POSTURE variable)
2. Verify animation frames are updating (not stuck on frame 0)
3. Confirm position is interpolating (not jumping between tiles)
4. Check timing values match expectations
5. Verify cache invalidation when posture changes

---

## Critical Implementation Notes

### 1. Posture is the Key

The posture value ('std', 'mv', 'sit', etc.) determines which animation plays. Changing posture immediately changes which animation frames are used.

```
posture: 'std' → Animation "std.1" → Idle animation frames
posture: 'mv'  → Animation "mv.1" → Walking animation frames
```

### 2. Frame Counter Timing

Frame counter must increment at the right rate to match the 500ms movement duration. If you have N frames in the animation, all N frames should play during the 500ms movement.

### 3. Position Interpolation

Use linear interpolation: `newPos = oldPos + (delta × progress)` where progress goes from 0 to 1 over 500ms.

### 4. Multi-Layer System

Avatars are rendered as multiple sprite layers (head, body, legs, etc.). Each layer has independent frame offsets from the animation data.

### 5. Asset Name Construction

Sprite assets are named: `{scale}_{member}_{direction}_{frameNumber}`

Example: `h_b_2_3` means: large scale, body member, direction 2, frame 3

---

## Research Methodology

This analysis was created by:
1. Searching the nitro-renderer and nitro-react codebases
2. Tracing the movement/animation flow from messages to rendering
3. Extracting relevant code with exact line numbers
4. Creating diagrams and timing analysis
5. Documenting critical insights and common pitfalls

---

## Files Analyzed

Core Avatar System:
- AvatarLogic.ts (506 lines)
- AvatarVisualization.ts (1136 lines)
- AvatarImage.ts (1000+ lines)
- AvatarStructure.ts (200+ lines)

Movement System:
- MovingObjectLogic.ts (148 lines)
- RoomMessageHandler.ts (700+ lines)

Animation System:
- AnimationManager.ts (50 lines)
- Animation.ts (312 lines)
- ActionDefinition.ts (100+ lines)
- AvatarAction.ts (128 lines)

---

## Questions Answered

1. **How does an avatar switch from standing to walking?**
   - Posture changes from 'std' to 'mv', triggering animation swap

2. **How are animation frames updated during movement?**
   - Frame counter increments every 2 update cycles, cycling through animation frames

3. **How does the avatar move smoothly between tiles?**
   - Location is interpolated linearly over 500ms using (delta × progress)

4. **How do frame offsets affect sprite rendering?**
   - Each animation frame specifies dx, dy, dd (direction delta) offsets applied to sprite position

5. **What causes animation/movement desync?**
   - Different update rates: position updates every cycle, animation every 2 cycles

6. **How does the system know which animation to play?**
   - posture + parameter determines animation name ("mv.1", "std.1", etc.)

---

## Next Steps

To implement this in your Phaser renderer:

1. **Map the state machine:** Implement posture tracking (std, mv, sit, lay, etc.)
2. **Load animations:** Get the correct animation frames based on posture
3. **Update position:** Interpolate position over 500ms with proper timing
4. **Manage frames:** Increment frame counter at the right rate for the animation
5. **Render sprites:** Use frame-specific offsets for each sprite layer
6. **Handle transitions:** Smooth transitions between postures

---

## References

- Nitro Framework: TypeScript-based room rendering engine
- Animation System: Data-driven with XML-based animation definitions
- Timing: All values in milliseconds, can be adjusted via constants
- Compatibility: Analyzed from Nitro community implementation

---

Generated: 2025-10-22
Source: nitro-react and nitro-renderer codebases
Scope: Avatar movement and animation system analysis

