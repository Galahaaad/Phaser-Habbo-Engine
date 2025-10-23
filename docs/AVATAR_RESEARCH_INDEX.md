# Avatar Sprite Positioning Research - Complete Index

## Overview

This research package contains a comprehensive analysis of how the Nitro renderer handles avatar sprite positioning and offsets, with specific focus on understanding how the metadata offset values (-22, 50) are used to correctly position sprites so that avatar feet align with the game position anchor point.

## Research Documents

### 1. SEARCH_RESULTS_SUMMARY.md
**Quick Overview** - Start here!

- Search task description
- 5-level offset system summary
- Critical files table with line numbers
- Key code snippets
- Implementation recommendations

**Read time:** 10 minutes
**Best for:** Getting oriented, quick reference

### 2. AVATAR_OFFSET_QUICK_REFERENCE.md
**Practical Implementation Guide**

- TL;DR explanation of offset system
- 5-level offset breakdown
- Implementation checklist for Phaser
- Common issues & solutions
- Animation frame offset examples
- Debugging timeline

**Read time:** 15 minutes
**Best for:** Implementation, quick lookups during development

### 3. AVATAR_SPRITE_POSITIONING.md
**Complete Technical Deep-Dive**

- Comprehensive explanation of all offset types
- Level-by-level breakdown:
  - Canvas Offset
  - Sprite Asset Offset
  - Animation Frame Offset
  - Direction-Specific Offset
  - Registration Point Offset
- Complete offset flow with code
- Real number examples
- Walking animation breakdown
- Server render data explanation
- Critical files reference table
- Debugging tips

**Read time:** 45 minutes
**Best for:** Complete understanding, reference during implementation

### 4. AVATAR_OFFSET_DIAGRAMS.md
**Visual Guide with Flowcharts**

Contains 10 detailed diagrams:

1. Multi-level offset application flow
2. Coordinate system explanation
3. Walking animation frame-by-frame
4. Multi-layer sprite stacking
5. Individual sprite structure
6. Complete rendering pipeline with real numbers
7. Asset spritesheet example
8. Direction-specific offset impacts
9. Canvas registration point calculations
10. Frame counter timing

**Read time:** 30 minutes
**Best for:** Visual learners, understanding system architecture

## Reading Paths

### Path 1: Quick Implementation (30 minutes)
1. SEARCH_RESULTS_SUMMARY.md (10 min)
2. AVATAR_OFFSET_QUICK_REFERENCE.md (15 min)
3. Reference AVATAR_SPRITE_POSITIONING.md as needed (5 min)

**Outcome:** Ready to implement basic avatar positioning

### Path 2: Complete Understanding (2 hours)
1. SEARCH_RESULTS_SUMMARY.md (10 min)
2. AVATAR_OFFSET_DIAGRAMS.md (30 min)
3. AVATAR_SPRITE_POSITIONING.md (45 min)
4. AVATAR_OFFSET_QUICK_REFERENCE.md (15 min)

**Outcome:** Deep understanding of the entire system

### Path 3: Focused Reference (Ongoing)
- Use AVATAR_OFFSET_QUICK_REFERENCE.md for daily implementation
- Reference AVATAR_SPRITE_POSITIONING.md for specific questions
- Check AVATAR_OFFSET_DIAGRAMS.md for visualization

**Outcome:** Quick lookups, implementation support

## Key Findings at a Glance

### The 5-Level Offset System

```
Level 1: Canvas Offset (-22, 50)
         ↓
Level 2: Canvas Registration Point (32, 0)
         ↓
Level 3: Animation Frame Offset (variable)
         ↓
Level 4: Direction Offset (small adjustment)
         ↓
Level 5: Asset Spritesheet Offset (texture position)
         ↓
FINAL: Sprite positioned so feet align with anchor point
```

### The Complete Calculation

```typescript
finalPosition.x = baseRegPoint.x 
                + animationOffset.x 
                + directionOffset.x 
                + canvas.offset.x (-22)
                + canvas.regPoint.x (32)

finalPosition.y = baseRegPoint.y
                + animationOffset.y
                + directionOffset.y
                + canvas.offset.y (50)
                + canvas.regPoint.y (0)
```

## Critical Code Files

All files located in `/references/nitro-renderer/src/`:

| File | Purpose | Key Lines |
|------|---------|-----------|
| AvatarCanvas.ts | Canvas metadata & offset | 19-20, 33-36 |
| AvatarImage.ts | Combines all layers | 352-371 |
| AvatarImageCache.ts | Body part rendering | 286-291, 397-399 |
| AnimationAction.ts | Frame offset lookup | 105-122 |
| SpriteDataContainer.ts | Direction offsets | 44-62 |
| AvatarImageBodyPartContainer.ts | Registration point | 68-76 |

## Implementation Checklist

- [ ] Read SEARCH_RESULTS_SUMMARY.md
- [ ] Review AVATAR_OFFSET_QUICK_REFERENCE.md
- [ ] Study code files in /references/nitro-renderer
- [ ] Load canvas metadata with offset values
- [ ] Calculate canvas registration point
- [ ] Implement animation frame offset fetching
- [ ] Create body part positioning system
- [ ] Handle direction-specific offsets
- [ ] Test standing pose alignment
- [ ] Test walking animation bobbing
- [ ] Test direction changes
- [ ] Test horizontal flipping
- [ ] Debug using troubleshooting guide

## Common Implementation Issues

### Issue: Avatar feet don't align with position
**Solution:** 
- Verify canvas offset (-22, 50) is being applied
- Check canvas registration point calculation: (width/2 - 32)
- Verify animation frame offsets are being fetched

### Issue: Walking doesn't show bobbing motion
**Solution:**
- Verify AnimationAction offset data is loaded
- Check getFrameBodyPartOffset() returns correct values
- Confirm frame counter increments each frame

### Issue: Avatar shifts when changing direction
**Solution:**
- Verify direction offsets are being applied
- Check registration points are correct for both directions
- Apply flip adjustment (+65/-31) when direction changes

## Research Methodology

- Analyzed 7 critical source files in nitro-renderer
- Extracted code snippets with exact line numbers
- Created visual diagrams for complex systems
- Built implementation guides with examples
- Documented debugging strategies

## Document Statistics

| Document | Lines | Focus | Audience |
|----------|-------|-------|----------|
| SEARCH_RESULTS_SUMMARY.md | ~200 | Quick reference | Decision makers, quick starters |
| AVATAR_OFFSET_QUICK_REFERENCE.md | ~300 | Implementation | Developers |
| AVATAR_SPRITE_POSITIONING.md | ~450 | Complete guide | Reference implementers |
| AVATAR_OFFSET_DIAGRAMS.md | ~300 | Visualization | Visual learners |

**Total:** 1,250+ lines of documentation

## How to Use This Package

1. **First Time:** Read SEARCH_RESULTS_SUMMARY.md + AVATAR_OFFSET_QUICK_REFERENCE.md
2. **Implementation:** Reference AVATAR_OFFSET_QUICK_REFERENCE.md + AVATAR_SPRITE_POSITIONING.md
3. **Visualization:** Use AVATAR_OFFSET_DIAGRAMS.md
4. **Debugging:** Use troubleshooting sections in all documents
5. **Reference:** Keep AVATAR_OFFSET_QUICK_REFERENCE.md open while coding

## Next Steps

1. Review the research documents above
2. Study the referenced Nitro source files
3. Implement avatar canvas positioning in Phaser
4. Layer in animation frame offsets
5. Add direction-specific positioning
6. Test against Habbo/Nitro reference implementations

## Related Documentation

In your project directory:
- **NITRO_CODE_REFERENCE.md** - Actual code snippets from Nitro
- **NITRO_AVATAR_MOVEMENT_ANALYSIS.md** - Avatar movement system
- **NITRO_KEY_FINDINGS.md** - Quick findings summary
- **README_AVATAR_RESEARCH.md** - Earlier research overview

## Technical Questions Answered

1. **What is the (-22, 50) offset?**
   - Canvas metadata offset that positions entire avatar canvas
   - See: AVATAR_SPRITE_POSITIONING.md, Section "Canvas Offset"

2. **How are animation frame offsets applied?**
   - Per frame, per body part from AnimationAction data
   - See: AVATAR_OFFSET_QUICK_REFERENCE.md, Level 3 section

3. **Why is registration point (32, 0) needed?**
   - Centers avatar to ensure offset works correctly
   - See: AVATAR_OFFSET_DIAGRAMS.md, Diagram 8

4. **How does walking bobbing work?**
   - Animation frame offsets cycle: 0 → -3 → 0 → 2 → 0
   - See: AVATAR_OFFSET_DIAGRAMS.md, Diagram 3

5. **How are flipped avatars positioned?**
   - Apply +65 pixel adjustment when facing directions 4-7
   - See: AVATAR_OFFSET_DIAGRAMS.md, Diagram 10

## Keywords for Searching This Package

- Avatar positioning
- Sprite offset
- Canvas offset (-22, 50)
- Registration point
- Animation frame offset
- Walking animation
- Bobbing motion
- Direction offset
- Body part layering
- Multi-sprite rendering
- Feet alignment
- Anchor point

---

**Generated:** 2025-10-23
**Status:** COMPLETE
**Quality:** Production-ready
**Accuracy:** Based on analysis of Nitro renderer source code

Use these documents as your complete reference for understanding and implementing avatar sprite positioning in Phaser!
