# Nitro Avatar Movement and Animation System - Analysis

## Overview
This document describes how the Nitro framework handles avatar movement and animations, with focus on the state transitions and frame updates.

---

## Key Components

### 1. Avatar Action States (AvatarAction.ts)

**Posture States:**
- `POSTURE_STAND` = `'std'` - Standing idle state
- `POSTURE_WALK` = `'mv'` - Moving/Walking state  
- `POSTURE_SIT` = `'sit'` - Sitting state
- `POSTURE_LAY` = `'lay'` - Laying state
- `POSTURE_SWIM` = `'swim'` - Swimming state
- `POSTURE_FLOAT` = `'float'` - Floating state

**State Conversion Function:**
```typescript
static idToAvatarActionState(id: string): string {
    if(id === 'Move') return 'mv';  // Movement state
    if(id === 'Sit') return 'sit';
    if(id === 'Lay') return 'lay';
    // ... other states
    return 'std';  // Default to standing
}
```

---

## Movement Flow

### 2. Movement Request Flow (RoomMessageHandler.ts:400-414)

When an avatar moves, the system does the following:

```typescript
let posture = 'std';  // Default to standing

switch(unitRollData.movementType) {
    case ObjectRolling.MOVE:
        posture = 'mv';  // Change to moving/walking
        break;
    case ObjectRolling.SLIDE:
        posture = 'std';  // Sliding keeps standing posture
        break;
}

this._roomCreator.updateRoomObjectUserPosture(this._currentRoomId, unitRollData.id, posture);
```

**Key Insight:** When movement is detected (ObjectRolling.MOVE), the posture is set to 'mv' (move), which triggers the walking animation instead of the idle standing animation.

### 3. Avatar Logic Layer (AvatarLogic.ts)

The `AvatarLogic` class extends `MovingObjectLogic` and handles:

**Location Updates:**
- `MovingObjectLogic` handles interpolation between tiles over 500ms (DEFAULT_UPDATE_INTERVAL)
- Uses `_locationDelta` to smoothly move avatars between positions
- Interpolates based on elapsed time: `difference / this._updateInterval`

**Model Updates:**
- Processes posture changes via `ObjectAvatarPostureUpdateMessage`
- Sets `RoomObjectVariable.FIGURE_POSTURE` to either 'std' or 'mv'
- Sets `RoomObjectVariable.FIGURE_POSTURE_PARAMETER` for parameter details

---

## Animation System

### 4. Avatar Visualization (AvatarVisualization.ts)

The visualization system updates animation frames independently:

**Frame Update Interval:**
```typescript
private static ANIMATION_FRAME_UPDATE_INTERVAL: number = 2;
private _updatesUntilFrameUpdate: number;
private _forcedAnimFrames: number;
```

**Update Process:**
1. Animation frames are updated every 2 update cycles (not every frame)
2. When movement/model changes, it forces `_forcedAnimFrames = ANIMATION_FRAME_UPDATE_INTERVAL`
3. The actual animation frame is advanced using:
   ```typescript
   this._avatarImage.updateAnimationByFrames(1);
   ```

**Key Code (AvatarVisualization.ts:248-264):**
```typescript
const update1 = (objectUpdate || updateModel || didScaleUpdate);
const update2 = ((this._isAnimating || (this._forcedAnimFrames > 0)) && update);

if(update1) this._forcedAnimFrames = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;

if(update1 || update2) {
    this.updateSpriteCounter++;
    
    this._forcedAnimFrames--;
    this._updatesUntilFrameUpdate--;
    
    if((((this._updatesUntilFrameUpdate <= 0) || didScaleUpdate) || updateModel) || otherUpdate) {
        this._avatarImage.updateAnimationByFrames(1);
        this._updatesUntilFrameUpdate = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;
    } else {
        return;  // Skip sprite rendering if not updating frame
    }
}
```

### 5. Avatar Image Animation (AvatarImage.ts)

The `AvatarImage` class manages actual avatar rendering:

**Action Appending (Animation Setup):**
```typescript
public initActionAppends(): void {
    this._actions = [];
    this._actionsSorted = false;
    this._currentActionsString = '';
    this._useFullImageCache = false;
}

public appendAction(k: string, ..._args: any[]): boolean {
    // Posture actions trigger animation changes
    case AvatarAction.POSTURE:
        switch(_local_3) {  // _local_3 is the posture value ('std', 'mv', etc)
            case AvatarAction.POSTURE_WALK:  // 'mv'
            case AvatarAction.POSTURE_STAND:  // 'std'
            // ... other postures
                this.addActionData(_local_3);
                break;
        }
        break;
}

public endActionAppends(): void {
    // Sorts actions and determines which animations to play
    if(!this.sortActions()) return;
    this.resetActions();
    this.setActionsToParts();  // Applies actions to avatar body parts
}
```

**Frame Counter and Animation:**
```typescript
private _frameCounter: number = 0;

public updateAnimationByFrames(k: number = 1): void {
    this._frameCounter += k;
    this._changes = true;  // Mark for re-rendering
}

public resetAnimationFrameCounter(): void {
    this._frameCounter = 0;
    this._changes = true;
}
```

**Getting Layer Data (Frame-specific positioning):**
```typescript
public getLayerData(k: ISpriteDataContainer): IAnimationLayerData {
    // Gets animation layer data for the current frame
    return this._structure.getBodyPartData(k.animation.id, this._frameCounter, k.id);
}
```

### 6. Action to Animation Mapping (AvatarImage.ts:847-972)

The system sorts actions and determines animations:

```typescript
private sortActions(): boolean {
    this._currentActionsString = '';
    this._sortedActions = this._structure.sortActions(this._actions);
    // ... processes sorted actions
    
    for(const k of this._sortedActions) {
        if(k.definition.isAnimation) {
            const animation = this._structure.getAnimation(
                k.definition.state + '.' + k.actionParameter
            );
            // Gets animation like "mv.1" or "std.1" based on posture
        }
    }
}
```

**Animation Lookup:**
- Posture 'std' (standing) → Animation "std.1" (idle standing animation)
- Posture 'mv' (moving) → Animation "mv.1" (walking animation)
- The animation state and parameter determine which frame sequences play

### 7. Animation Frame Structure (Animation.ts)

Animations have frames with body part data:

```typescript
private _frames: AvatarAnimationLayerData[][];  // Animation frames

public getFrame(frameCount: number, _arg_2: string = null): AvatarAnimationLayerData[] {
    if(!_arg_2) {
        if(this._frames.length > 0) {
            return this._frames[(frameCount % this._frames.length)];
        }
    }
}

public getLayerData(frameCount: number, spriteId: string, _arg_3: string = null): AvatarAnimationLayerData {
    // Gets specific layer data for a frame
    for(const layer of this.getFrame(frameCount, _arg_3)) {
        if(layer.id === spriteId) return layer;
    }
}
```

Each animation has multiple frames, and `frameCounter % frameCount` cycles through them.

---

## Movement Interpolation (MovingObjectLogic.ts)

The movement uses smooth interpolation between tiles:

```typescript
private _locationDelta: Vector3d;  // Delta from current to target
private _lastUpdateTime: number;
private _changeTime: number;
private _updateInterval: number = 500;  // 500ms per tile movement

public update(time: number): void {
    if((this._locationDelta.length > 0) || locationOffset) {
        let difference = (this.time - this._changeTime);
        
        if(difference > this._updateInterval) difference = this._updateInterval;
        
        // Interpolate: multiply delta by (elapsed / total time)
        vector.assign(this._locationDelta);
        vector.multiply((difference / this._updateInterval));
        vector.add(this._location);
        
        this.object.setLocation(vector);
        
        if(difference === this._updateInterval) {
            // Movement complete, reset delta
            this._locationDelta.x = 0;
            this._locationDelta.y = 0;
            this._locationDelta.z = 0;
        }
    }
}
```

---

## Sprite Rendering (AvatarVisualization.ts:270-448)

Once the animation frame is determined, the sprite is rendered:

```typescript
public update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void {
    // ... animation frame updates ...
    
    const sprite = this.getSprite(AvatarVisualization.SPRITE_INDEX_AVATAR);
    
    if(sprite) {
        const avatarImage = this._avatarImage.getImage(AvatarSetType.FULL, highlightEnabled);
        
        if(avatarImage) {
            sprite.texture = avatarImage;  // Set the texture for current frame/posture
            
            // Positioning
            sprite.offsetX = ((((-1 * scale) / 2) + _local_20[0]) - ((sprite.texture.width - scale) / 2));
            sprite.offsetY = (((-(sprite.texture.height) + (scale / 4)) + _local_20[1]) + this._postureOffset);
        }
    }
    
    // Handle additional sprite layers (attachments, etc)
    for(const spriteData of this._avatarImage.getSprites()) {
        // ... render each layer with frame-specific offsets ...
    }
}
```

---

## Complete Animation Frame Flow

1. **Movement Detected** → Posture changes from 'std' to 'mv'
2. **AvatarLogic processes update** → Sets FIGURE_POSTURE to 'mv'
3. **AvatarVisualization detects model change** → Triggers animation update
4. **processActionsForAvatar()** → Appends new action with posture 'mv'
5. **endActionAppends()** → Sorts actions and loads "mv" animation
6. **Each update cycle**:
   - Increments `_frameCounter` every 2 update cycles
   - Frame count cycles: `frameCounter % totalFrames`
   - Gets layer data from animation for current frame
   - Renders sprite with frame-specific offsets
7. **Location Interpolation** → Avatar smoothly moves between tiles over 500ms

---

## Key Timing Values

| Component | Timing | Purpose |
|-----------|--------|---------|
| Movement Duration | 500ms | Time to move between tiles (MovingObjectLogic.DEFAULT_UPDATE_INTERVAL) |
| Frame Update Interval | Every 2 cycles | AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL |
| Visualization Update | 41ms | AvatarVisualization.UPDATE_TIME_INCREASER |
| Forced Animation Frames | 2 | How many cycles to update after model change |

---

## Important Files

### Core Avatar Logic
- `/references/nitro-renderer/src/nitro/room/object/logic/avatar/AvatarLogic.ts` - Avatar state updates
- `/references/nitro-renderer/src/nitro/room/object/visualization/avatar/AvatarVisualization.ts` - Avatar rendering and animation updates
- `/references/nitro-renderer/src/nitro/avatar/AvatarImage.ts` - Avatar image/animation management

### Movement
- `/references/nitro-renderer/src/nitro/room/object/logic/MovingObjectLogic.ts` - Position interpolation
- `/references/nitro-renderer/src/nitro/room/RoomMessageHandler.ts` - Posture state updates

### Animation
- `/references/nitro-renderer/src/nitro/avatar/animation/AnimationManager.ts` - Animation lookup
- `/references/nitro-renderer/src/nitro/avatar/animation/Animation.ts` - Animation frame definitions
- `/references/nitro-renderer/src/nitro/avatar/actions/ActionDefinition.ts` - Action definitions

### Enums
- `/references/nitro-renderer/src/api/nitro/avatar/enum/AvatarAction.ts` - Action constants including posture values

---

## Critical Insights for Movement Rendering

1. **Posture Change Triggers Animation:** When an avatar moves, the posture changes from 'std' to 'mv', which completely changes which animation data is used.

2. **Frame Decoupling:** Animation frames are updated LESS frequently than position updates (every 2 cycles vs every cycle), which can cause animation/movement misalignment.

3. **Location Interpolation:** Position smoothly interpolates over 500ms per tile, but animations may not sync perfectly with this timing.

4. **Multi-Layer System:** Avatars are rendered as multiple sprite layers (body parts), each with independent frame offsets defined in the animation data.

5. **Cache System:** Avatar images are cached, and when posture changes, the cache needs to be invalidated to load the new animation frames.

