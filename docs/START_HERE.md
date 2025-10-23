# Nitro Avatar Movement Research - START HERE

Welcome! This directory contains comprehensive analysis of how the Nitro framework handles avatar movement and animations.

## Quick Navigation

### For a Quick Overview (5 minutes)
- Read: **EXECUTIVE_SUMMARY.txt**
- Gets you up to speed on key findings

### For Understanding the System (30 minutes)
1. Read: **README_AVATAR_RESEARCH.md**
2. Read: **NITRO_KEY_FINDINGS.md**
- Gives complete understanding of how it works

### For Implementation (Reference)
- Use: **NITRO_CODE_REFERENCE.md**
- Use: **NITRO_AVATAR_MOVEMENT_ANALYSIS.md**
- These have exact code snippets and line numbers

---

## The Core Insight

When an avatar moves in Nitro:

```
Posture 'std' (standing)  →  User moves  →  Posture 'mv' (walking)
                                            ↓
                                      Animation switches from "std.1" to "mv.1"
                                      Position interpolates over 500ms
                                      Frame counter increments every 2 cycles
                                      Creates smooth walking animation
```

---

## Key Facts

| Item | Value |
|------|-------|
| Walking posture value | 'mv' (not 'wlk'!) |
| Standing posture value | 'std' |
| Movement duration | 500ms per tile |
| Position update frequency | Every 41ms |
| Animation frame update frequency | Every 2 cycles (82ms) |
| Animation lookup format | "{posture}.1" (e.g., "mv.1") |

---

## 5 Critical Files

These are the files you need to understand:

1. **AvatarLogic.ts** (506 lines)
   - Handles posture state changes and movement messages
   - Path: `/references/nitro-renderer/src/nitro/room/object/logic/avatar/AvatarLogic.ts`

2. **AvatarVisualization.ts** (1136 lines)
   - Updates animation frames every 2 cycles
   - Detects posture changes and triggers re-render
   - Path: `/references/nitro-renderer/src/nitro/room/object/visualization/avatar/AvatarVisualization.ts`

3. **MovingObjectLogic.ts** (148 lines)
   - Handles position interpolation over 500ms
   - Path: `/references/nitro-renderer/src/nitro/room/object/logic/MovingObjectLogic.ts`

4. **AvatarImage.ts** (1000+ lines)
   - Manages animation frame counter
   - Selects which animation to play based on posture
   - Path: `/references/nitro-renderer/src/nitro/avatar/AvatarImage.ts`

5. **RoomMessageHandler.ts** (700+ lines)
   - Sets posture = 'mv' when movement detected
   - Path: `/references/nitro-renderer/src/nitro/room/RoomMessageHandler.ts`

---

## The Problem (Why This Research Exists)

Avatar movement rendering has subtle timing issues:
- Position updates every 41ms
- Animation frames update every 2 cycles (82ms)
- This mismatch can cause animation to look jerky

**Solution:** Understand how Nitro synchronizes these and apply the same logic to your Phaser renderer.

---

## What's in Each Document

### EXECUTIVE_SUMMARY.txt (2 minutes)
Quick bullet-point summary of everything

### README_AVATAR_RESEARCH.md (5 minutes)
Overview of all documents and how to use them

### NITRO_KEY_FINDINGS.md (10 minutes)
- Standing vs Walking animations
- Animation frame flow diagrams
- Position interpolation details
- Critical timing values
- Common issues to avoid
- Absolute file paths

### NITRO_AVATAR_MOVEMENT_ANALYSIS.md (30 minutes)
- Complete technical breakdown
- 7 major components explained
- Complete animation flow
- Movement interpolation details
- Sprite rendering pipeline
- Timing analysis
- Critical insights

### NITRO_CODE_REFERENCE.md (Reference)
- Actual code snippets with line numbers
- 7 major code sections documented
- Complete call chain showing flow
- Ready to copy/reference during coding

---

## Implementation Checklist

When implementing avatar movement in your Phaser renderer:

- [ ] Track posture state (std, mv, sit, lay, etc.)
- [ ] Change animation when posture changes
- [ ] Update position with interpolation over 500ms
- [ ] Increment frame counter every 2 cycles
- [ ] Cycle through animation frames using modulo
- [ ] Apply frame-specific offsets to sprite layers
- [ ] Handle all 7 posture states correctly
- [ ] Test animation/movement synchronization
- [ ] Verify no frame counter stalling
- [ ] Verify smooth interpolation (no position jumps)

---

## Common Questions

**Q: Why is the posture value 'mv' and not 'wlk'?**
A: That's what Nitro uses. See AvatarAction.ts: `POSTURE_WALK = 'mv'`

**Q: Why do animation frames update every 2 cycles?**
A: It's a design choice in Nitro. See AvatarVisualization.ts: `ANIMATION_FRAME_UPDATE_INTERVAL = 2`

**Q: Why 500ms for movement?**
A: That's the default in MovingObjectLogic.ts: `DEFAULT_UPDATE_INTERVAL = 500`

**Q: Can these timing values be changed?**
A: Yes, they're constants at the top of each file. But the default Nitro uses these values.

**Q: What if my animation has 8 frames?**
A: With 500ms duration and frame update every 2 cycles (~82ms), all 8 frames will play during movement

---

## Success Indicators

You've implemented it correctly when:
- Avatar stands with still pose
- Avatar walks with walking animation
- Walking takes exactly 500ms per tile
- Movement is smooth (no jumps)
- Animation frames cycle through (legs move back and forth)
- No frames get stuck
- Position follows a smooth arc

---

## Research Quality

This research analyzed:
- **2000+ lines** of Nitro source code
- **10+ critical files** in the codebase
- **Complete call chains** from message to rendering
- **Exact line numbers** for all code references
- **Detailed timing analysis** with constant values

Total documentation: **2200+ lines** of reference material

---

## Next Steps

1. **Read the EXECUTIVE_SUMMARY.txt** (2 min)
2. **Read the NITRO_KEY_FINDINGS.md** (10 min)
3. **Skim NITRO_CODE_REFERENCE.md** (reference)
4. **Start implementing** with documentation nearby
5. **Reference NITRO_AVATAR_MOVEMENT_ANALYSIS.md** when you need deep dives

---

## File Locations

All documentation is in:
`/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/`

All source code references are in:
`/Users/mamoune.nidam/Desktop/Perso/Phaser-Renderer/references/nitro-renderer/src/`

---

**Status:** Analysis Complete - Ready for Implementation
**Date:** 2025-10-22
**Scope:** Nitro avatar movement and animation system

