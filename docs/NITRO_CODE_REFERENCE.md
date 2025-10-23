# Nitro Avatar Movement - Code Reference

## 1. Posture State Changes

### File: AvatarAction.ts (Enum Constants)
```typescript
public static POSTURE_STAND = 'std';
public static POSTURE_WALK = 'mv';  // Key: 'mv' not 'wlk'!

// Convert action ID to posture state
static idToAvatarActionState(id: string): string {
    if(id === 'Move') return 'mv';
    // ... other conversions
    return 'std';  // Default
}
```

### File: RoomMessageHandler.ts (Line 400-414)
**When movement is detected, posture is set to 'mv':**
```typescript
private onRoomRollingEvent(event: ObjectsRollingEvent): void {
    for(const unitRollData of event.rollDatas) {
        const object = this._roomCreator.getRoomObject(this._currentRoomId, unitRollData.id);
        
        if(object && object.type !== RoomObjectUserType.MONSTER_PLANT) {
            let posture = 'std';  // Default to standing
            
            switch(unitRollData.movementType) {
                case ObjectRolling.MOVE:
                    posture = 'mv';  // Change to movement/walking
                    break;
                case ObjectRolling.SLIDE:
                    posture = 'std';  // Sliding keeps standing
                    break;
            }
            
            // Update the avatar's posture in the room
            this._roomCreator.updateRoomObjectUserPosture(
                this._currentRoomId, 
                unitRollData.id, 
                posture
            );
        }
    }
}
```

---

## 2. Position Interpolation

### File: MovingObjectLogic.ts (Line 38-101)
**Smooth movement over 500ms per tile:**
```typescript
public update(time: number): void {
    super.update(time);
    
    const locationOffset = this.getLocationOffset();
    const model = this.object && this.object.model;
    
    // Handle lift amount for furniture
    if(model && locationOffset) {
        model.setValue(RoomObjectVariable.FURNITURE_LIFT_AMOUNT, locationOffset.z);
    }
    
    // Interpolate movement
    if((this._locationDelta.length > 0) || locationOffset) {
        const vector = MovingObjectLogic.TEMP_VECTOR;
        
        let difference = (this.time - this._changeTime);
        
        if(difference === (this._updateInterval >> 1)) difference++;
        if(difference > this._updateInterval) difference = this._updateInterval;
        
        if(this._locationDelta.length > 0) {
            // Linear interpolation: progress = elapsed / total_duration
            vector.assign(this._locationDelta);
            vector.multiply((difference / this._updateInterval));  // 0.0 to 1.0
            vector.add(this._location);
        } else {
            vector.assign(this._location);
        }
        
        if(locationOffset) vector.add(locationOffset);
        
        // Set the interpolated position
        this.object.setLocation(vector);
        
        // Reset when movement complete
        if(difference === this._updateInterval) {
            this._locationDelta.x = 0;
            this._locationDelta.y = 0;
            this._locationDelta.z = 0;
        }
    }
    
    this._lastUpdateTime = this.time;
}

// Process movement message
private processMoveMessage(message: ObjectMoveUpdateMessage): void {
    if(!message || !this.object || !message.location) return;
    
    this._changeTime = this._lastUpdateTime;
    
    // Calculate delta from current to target
    this._locationDelta.assign(message.targetLocation);
    this._locationDelta.subtract(this._location);
    // Will interpolate over next 500ms
}
```

---

## 3. Animation Frame Updates

### File: AvatarVisualization.ts (Line 157-265)
**Animation frame updating - CRITICAL LOGIC:**
```typescript
public update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void {
    if(!this.object || !geometry || !this._data) return;
    
    // Throttle updates to 41ms intervals
    if(time < (this._lastUpdate + AvatarVisualization.UPDATE_TIME_INCREASER)) return;
    
    this._lastUpdate += AvatarVisualization.UPDATE_TIME_INCREASER;
    if((this._lastUpdate + AvatarVisualization.UPDATE_TIME_INCREASER) < time) {
        this._lastUpdate = (time - AvatarVisualization.UPDATE_TIME_INCREASER);
    }
    
    const model = this.object.model;
    const updateModel = this.updateModel(model, scale);
    
    // Check for updates (model changed, scale changed, etc)
    const update1 = (objectUpdate || updateModel || didScaleUpdate);
    const update2 = ((this._isAnimating || (this._forcedAnimFrames > 0)) && update);
    
    // Force animation frame updates for 2 cycles after model change
    if(update1) {
        this._forcedAnimFrames = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;  // = 2
    }
    
    if(update1 || update2) {
        this.updateSpriteCounter++;
        
        this._forcedAnimFrames--;
        this._updatesUntilFrameUpdate--;
        
        // Update animation frame every 2 update cycles
        if((((this._updatesUntilFrameUpdate <= 0) || didScaleUpdate) || updateModel) || otherUpdate) {
            // ADVANCE TO NEXT ANIMATION FRAME
            this._avatarImage.updateAnimationByFrames(1);  // Increment frameCounter
            
            this._updatesUntilFrameUpdate = AvatarVisualization.ANIMATION_FRAME_UPDATE_INTERVAL;  // Reset to 2
        } else {
            return;  // Skip rendering if frame not updated
        }
        
        // ... render sprite with new frame data ...
    }
}
```

---

## 4. Avatar Image Animation Management

### File: AvatarImage.ts (Line 213-223)
**Frame counter management:**
```typescript
private _frameCounter: number = 0;

// Called when posture changes or during animation
public updateAnimationByFrames(k: number = 1): void {
    this._frameCounter += k;
    this._changes = true;  // Mark that sprite needs re-rendering
}

// Reset when returning to idle/default
public resetAnimationFrameCounter(): void {
    this._frameCounter = 0;
    this._changes = true;
}

// Get layer data for current frame
public getLayerData(k: ISpriteDataContainer): IAnimationLayerData {
    return this._structure.getBodyPartData(
        k.animation.id,      // Animation name (e.g., "mv")
        this._frameCounter,   // Current frame index
        k.id                  // Body part ID
    );
}
```

### File: AvatarImage.ts (Line 669-693)
**Action appending (determines animation):**
```typescript
public initActionAppends(): void {
    this._actions = [];
    this._actionsSorted = false;
    this._currentActionsString = '';
    this._useFullImageCache = false;
}

public appendAction(k: string, ..._args: any[]): boolean {
    let actionParameter = '';
    
    this._actionsSorted = false;
    
    if(_args && (_args.length > 0)) actionParameter = _args[0];
    if((actionParameter !== undefined) && (actionParameter !== null)) {
        actionParameter = actionParameter.toString();
    }
    
    switch(k) {
        case AvatarAction.POSTURE:
            switch(actionParameter) {
                case AvatarAction.POSTURE_WALK:     // 'mv'
                case AvatarAction.POSTURE_STAND:    // 'std'
                case AvatarAction.POSTURE_SIT:      // 'sit'
                case AvatarAction.POSTURE_LAY:      // 'lay'
                    // ... more posture types ...
                    this.addActionData(actionParameter);
                    break;
            }
            break;
    }
    
    return true;
}

public endActionAppends(): void {
    if(!this.sortActions()) return;
    
    // Download effects if needed
    for(const k of this._sortedActions) {
        if(k.actionType === AvatarAction.EFFECT) {
            if(!this._effectManager.isAvatarEffectReady(parseInt(k.actionParameter))) {
                this._effectManager.downloadAvatarEffect(parseInt(k.actionParameter), this);
            }
        }
    }
    
    this.resetActions();
    this.setActionsToParts();  // Apply actions to body parts
}
```

### File: AvatarImage.ts (Line 847-910)
**Sort actions and load animations:**
```typescript
private sortActions(): boolean {
    this._currentActionsString = '';
    
    // Sort by precedence
    this._sortedActions = this._structure.sortActions(this._actions);
    
    // Calculate max animation frames
    this._animationFrameCount = this._structure.maxFrames(this._sortedActions);
    
    if(!this._sortedActions) {
        this._canvasOffsets = [0, 0, 0];
        // ... handle empty actions ...
    } else {
        for(const action of this._sortedActions) {
            this._currentActionsString = (
                this._currentActionsString + 
                (action.actionType + action.actionParameter)
            );
        }
        
        // Check for effect changes
        let effectChanged = false;
        let hasEffect = false;
        
        for(const action of this._sortedActions) {
            if(action.actionType === AvatarAction.EFFECT) {
                const effectId = parseInt(action.actionParameter);
                if(this._effectIdInUse !== effectId) effectChanged = true;
                this._effectIdInUse = effectId;
                hasEffect = true;
            }
        }
        
        if(!hasEffect && this._effectIdInUse > -1) {
            effectChanged = true;
            this._effectIdInUse = -1;
        }
        
        if(effectChanged) this._cache.disposeInactiveActions(0);
    }
    
    this._actionsSorted = true;
    return true;
}

private setActionsToParts(): void {
    if(!this._sortedActions) return;
    
    for(const action of this._sortedActions) {
        if((action && action.definition) && action.definition.isAnimation) {
            // Get animation for this action
            // Format: "posture.parameter" e.g., "mv.1" or "std.1"
            const animation = this._structure.getAnimation(
                (action.definition.state + '.') + action.actionParameter
            );
            
            if(animation) {
                this._sprites = this._sprites.concat(animation.spriteData);
                // Load sprite data, direction data, avatar data
            }
        }
        
        this.setActionToParts(action, currentTime);
    }
}
```

---

## 5. Animation Lookup

### File: AvatarImage.ts (Line 912-972)
**How animations are selected based on posture:**
```typescript
private setActionsToParts(action: IActiveActionData, time: number): void {
    if((action == null) || (action.definition == null)) return;
    if(action.definition.assetPartDefinition === '') return;
    
    if(action.definition.isMain) {
        this._mainAction = action;
        this._cache.setGeometryType(action.definition.geometryType);
    }
    
    this._cache.setAction(action, time);
    this._changes = true;
}
```

### File: Animation.ts (Line 223-242)
**Get specific frame layer data:**
```typescript
public getLayerData(frameCount: number, spriteId: string, _arg_3: string = null): AvatarAnimationLayerData {
    // Get the frame array for current frameCount
    // Frame cycles: frameCount % totalFrames
    
    for(const layer of this.getFrame(frameCount, _arg_3)) {
        if(layer.id === spriteId) return layer;
        
        // Check FX layers with add data
        if(layer.type === AvatarAnimationLayerData.FX) {
            if(this._addData && this._addData.length) {
                for(const addData of this._addData) {
                    if(((addData.align === spriteId) && (addData.id === layer.id))) {
                        return layer;
                    }
                }
            }
        }
    }
    
    return null;
}

private getFrame(frameCount: number, _arg_2: string = null): AvatarAnimationLayerData[] {
    if(frameCount < 0) frameCount = 0;
    
    let layers: AvatarAnimationLayerData[] = [];
    
    if(!_arg_2) {
        if(this._frames.length > 0) {
            // Cycle through frames: 0, 1, 2, ... 0, 1, 2, ...
            layers = this._frames[(frameCount % this._frames.length)];
        }
    } else {
        // Get override frames if they exist
        const overrideLayers = this._overrideFrames.get(_arg_2);
        if(overrideLayers && (overrideLayers.length > 0)) {
            layers = overrideLayers[(frameCount % overrideLayers.length)];
        }
    }
    
    return layers;
}
```

---

## 6. Sprite Rendering with Frame Data

### File: AvatarVisualization.ts (Line 270-448)
**Render sprite with animation frame offsets:**
```typescript
public update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void {
    // ... animation frame update logic ...
    
    if(update1 || update2) {
        // ... update frame counter ...
        
        let canvasOffsets = this._avatarImage.getCanvasOffsets();
        if(!canvasOffsets || (canvasOffsets.length < 3)) {
            canvasOffsets = AvatarVisualization.DEFAULT_CANVAS_OFFSETS;
        }
        
        const sprite = this.getSprite(AvatarVisualization.SPRITE_INDEX_AVATAR);
        
        if(sprite) {
            const highlightEnabled = ((this.object.model.getValue<number>(RoomObjectVariable.FIGURE_HIGHLIGHT_ENABLE) === 1) && 
                                     (this.object.model.getValue<number>(RoomObjectVariable.FIGURE_HIGHLIGHT) === 1));
            
            // Get the rendered avatar image for current frame
            const avatarImage = this._avatarImage.getImage(AvatarSetType.FULL, highlightEnabled);
            
            if(avatarImage) {
                sprite.texture = avatarImage;  // Set sprite texture
                
                // Position sprite on screen
                sprite.offsetX = ((((-1 * scale) / 2) + canvasOffsets[0]) - 
                                ((sprite.texture.width - scale) / 2));
                sprite.offsetY = (((-(sprite.texture.height) + (scale / 4)) + canvasOffsets[1]) + 
                                this._postureOffset);
            }
            
            // Update depth/sorting
            if(this._isLaying) {
                sprite.relativeDepth = (AvatarVisualization.AVATAR_SPRITE_LAYING_DEPTH + canvasOffsets[2]);
            } else {
                sprite.relativeDepth = (AvatarVisualization.AVATAR_SPRITE_DEFAULT_DEPTH + canvasOffsets[2]);
            }
        }
        
        // Render additional sprite layers (body parts)
        let layerIndex = AvatarVisualization.INITIAL_RESERVED_SPRITES;
        const avatarDirection = this._avatarImage.getDirection();
        
        for(const spriteData of this._avatarImage.getSprites()) {
            if(spriteData.id === AvatarVisualization.AVATAR) {
                // Already rendered main avatar above
                continue;
            }
            
            const sprite = this.getSprite(layerIndex);
            
            if(sprite) {
                sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;
                sprite.visible = true;
                
                // Get frame data for this layer
                const layerData = this._avatarImage.getLayerData(spriteData);
                
                let frameNumber = 0;
                let offsetX = spriteData.getDirectionOffsetX(avatarDirection);
                let offsetY = spriteData.getDirectionOffsetY(avatarDirection);
                const offsetZ = spriteData.getDirectionOffsetZ(avatarDirection);
                let dd = 0;  // Direction delta
                
                if(spriteData.hasDirections) dd = avatarDirection;
                
                // Apply frame-specific offsets
                if(layerData) {
                    frameNumber = layerData.animationFrame;
                    offsetX += layerData.dx;      // Frame X offset
                    offsetY += layerData.dy;      // Frame Y offset
                    dd += layerData.dd;            // Frame direction delta
                }
                
                // Normalize direction
                if(dd < 0) dd += 8;
                else if(dd > 7) dd -= 8;
                
                // Build asset name: scale_member_direction_frame
                const assetName = ((((((this._avatarImage.getScale() + '_') + 
                                    spriteData.member + '_') + dd) + '_') + frameNumber);
                
                // Get the asset
                const asset = this._avatarImage.getAsset(assetName);
                
                if(!asset) continue;
                
                sprite.texture = asset.texture;
                sprite.offsetX = ((asset.offsetX - (scale / 2)) + offsetX);
                sprite.offsetY = (asset.offsetY + offsetY);
                sprite.flipH = asset.flipH;
                
                // ... set depth and other properties ...
            }
            
            layerIndex++;
        }
    }
}
```

---

## 7. Model Updates (Posture Changes)

### File: AvatarVisualization.ts (Line 547-875)
**Detect when posture changes:**
```typescript
protected updateModel(model: IRoomObjectModel, scale: number): boolean {
    if(!model) return false;
    
    if(this.updateModelCounter === model.updateCounter) return false;
    
    let needsUpdate = false;
    
    // ... check other model values ...
    
    const posture = model.getValue<string>(RoomObjectVariable.FIGURE_POSTURE);
    
    if(posture !== this._posture) {
        this._posture = posture;  // Changed from 'std' to 'mv' or vice versa
        needsUpdate = true;
    }
    
    const postureParameter = model.getValue<string>(RoomObjectVariable.FIGURE_POSTURE_PARAMETER);
    
    if(postureParameter !== this._postureParameter) {
        this._postureParameter = postureParameter;
        needsUpdate = true;
    }
    
    // ... check other model values ...
    
    this.updateModelCounter = model.updateCounter;
    
    return needsUpdate;
}

private processActionsForAvatar(avatar: IAvatarImage): void {
    if(!avatar) return;
    
    avatar.initActionAppends();
    
    // THIS IS WHERE POSTURE TRIGGERS ANIMATION CHANGE
    avatar.appendAction(AvatarAction.POSTURE, this._posture, this._postureParameter);
    
    // Add other actions...
    if(this._gesture > 0) this._avatarImage.appendAction(AvatarAction.GESTURE, ...);
    if(this._dance > 0) this._avatarImage.appendAction(AvatarAction.DANCE, ...);
    
    avatar.endActionAppends();  // Load the "mv.1" or "std.1" animation
    
    this._isAnimating = avatar.isAnimating();
}
```

---

## Summary of Call Chain for Movement

```
1. onRoomRollingEvent() [RoomMessageHandler.ts:400]
   ↓ Sets posture = 'mv'
2. updateRoomObjectUserPosture()
   ↓ Updates model FIGURE_POSTURE
3. AvatarVisualization.update() [Line 157]
   ↓ Detects model changed
4. updateModel() [Line 547]
   ↓ Detects this._posture changed from 'std' to 'mv'
   ↓ Returns needsUpdate = true
5. processActionsForAvatar() [Line 912]
   ↓ Calls avatar.appendAction(POSTURE, 'mv')
   ↓ Calls avatar.endActionAppends()
6. AvatarImage.endActionAppends() [Line 677]
   ↓ Calls sortActions()
   ↓ Gets animation "mv.1"
   ↓ Calls setActionsToParts()
7. Loop: Every 2 update cycles
   ↓ updateAnimationByFrames(1)
   ↓ Increments _frameCounter
   ↓ Gets new frame data via getLayerData()
8. Rendering
   ↓ Builds asset name with new frame number
   ↓ Renders sprite with frame-specific offsets

Meanwhile, in parallel:
- MovingObjectLogic.update() interpolates position over 500ms
- Sets location from current + (delta * progress)
```

