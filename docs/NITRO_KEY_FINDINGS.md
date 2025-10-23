# Nitro Avatar Movement - Key Findings Summary

## Quick Reference

### 1. How Walking vs Standing Works

**Standing Animation ('std'):**
- Posture: `'std'` (AvatarAction.POSTURE_STAND)
- Animation lookup: `"std.1"` (idle animation)
- Avatar shows standing idle frames

**Walking Animation ('mv'):**
- Posture: `'mv'` (AvatarAction.POSTURE_WALK)
- Animation lookup: `"mv.1"` (walking animation)
- Avatar shows walking/movement frames
- Triggered when: `ObjectRolling.MOVE` event

### 2. Animation Frame Update Flow

```
Update Cycle
    ↓
Check if model changed (posture: std → mv)
    ↓
If changed: Set _forcedAnimFrames = 2
    ↓
Every 2 update cycles:
    updateAnimationByFrames(1)  ← Increments frame counter
    frameCounter = frameCounter % totalFrames
    ↓
Render sprite with frame-specific offsets
```

### 3. Position Interpolation

```
Movement Command (500ms duration)
    ↓
Set _locationDelta = targetPos - currentPos
    ↓
Each frame during 500ms window:
    elapsed = currentTime - startTime
    progress = elapsed / 500ms (0 to 1)
    newPos = currentPos + (_locationDelta * progress)
    ↓
After 500ms: Reset _locationDelta to 0
```

### 4. Critical Timing Values

- **Movement Duration:** 500ms (DEFAULT_UPDATE_INTERVAL)
- **Animation Frame Update:** Every 2 update cycles
- **Update Cycle Duration:** 41ms (UPDATE_TIME_INCREASER)
- **Forced Animation Frames:** 2 cycles after posture change

### 5. File Structure for Implementation

**For rendering avatar movement, focus on:**

1. **AvatarLogic.ts** - Handles posture changes and state
2. **AvatarVisualization.ts** - Updates animation frames every 2 cycles
3. **MovingObjectLogic.ts** - Interpolates position over 500ms
4. **AvatarImage.ts** - Maps posture ('std'/'mv') to animations
5. **RoomMessageHandler.ts** - Sets posture based on movement type

### 6. State Machine for Movement

```
Avatar Idle (std)
    ↓ (Movement command received)
Avatar Walking (mv) [Frame counter starts]
    ↓ (Movement duration 500ms)
Avatar interpolates position & plays walking frames
    ↓ (Movement ends, location final)
Avatar returns to Idle (std)
```

### 7. Animation Frame Data Flow

```
Posture 'mv' → appendAction(AvatarAction.POSTURE, 'mv')
    ↓
getAnimation("mv.1") → Gets animation definition
    ↓
Animation has array of frames: [frame0, frame1, frame2, ...]
    ↓
frameCounter % frameCount → Cycles through frames
    ↓
getLayerData(frameCounter) → Gets offsets for current frame
    ↓
Render sprite with frame-specific x, y, z offsets
```

### 8. Multi-Layer Rendering

Avatars have multiple sprite layers (head, body, legs, etc.):
- Each layer has independent animation frame data
- Each frame in animation specifies layer offsets (dx, dy, dd)
- All layers update together as frame counter increments

### 9. Common Issues to Avoid

1. **Animation/Movement Mismatch:** Frames update every 2 cycles but position updates every cycle
   - Solution: Ensure frame timing matches movement duration

2. **Posture Not Changing:** Make sure `processActionsForAvatar()` gets called
   - It reads FIGURE_POSTURE and appends the action
   - If not called, posture won't change to 'mv'

3. **Stale Cache:** Avatar image cache may not be invalidated
   - When posture changes, need to reload animation frames
   - Check `clearAvatar()` and cache invalidation

4. **Frame Counter Reset:** Walking animation should reset when movement ends
   - Call `resetAnimationFrameCounter()` when returning to 'std'

### 10. Key Variables to Track

```typescript
// In AvatarVisualization
_frameCounter: number;           // Current animation frame (0, 1, 2, ...)
_updatesUntilFrameUpdate: number; // Countdown to next frame update
_forcedAnimFrames: number;        // Force N frames to update after model change
_posture: string;                 // Current posture: 'std', 'mv', etc.

// In MovingObjectLogic
_locationDelta: Vector3d;        // Delta to target position
_lastUpdateTime: number;         // Time of last update
_changeTime: number;             // When movement started
_updateInterval: number = 500;   // Movement duration in ms
```

---

## File Paths (Absolute)

Core Files:
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/room/object/logic/avatar/AvatarLogic.ts`
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/room/object/visualization/avatar/AvatarVisualization.ts`
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/room/object/logic/MovingObjectLogic.ts`
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/avatar/AvatarImage.ts`
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/room/RoomMessageHandler.ts`

Enum/Constants:
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/api/nitro/avatar/enum/AvatarAction.ts`

Animation:
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/avatar/animation/Animation.ts`
- `/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/nitro/avatar/animation/AnimationManager.ts`

