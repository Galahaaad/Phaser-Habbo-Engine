# Session Recap : Avatar Positioning Fix

**Date :** 23 octobre 2025
**Objectif :** Corriger le positionnement des sprites d'avatar Habbo dans Phaser

---

## 🎯 Problème Initial

L'avatar Habbo ne s'affichait pas correctement :
- Les sprites (tête, corps, bras) étaient mal positionnés
- Tout était superposé au même endroit
- L'avatar n'était pas aligné avec le point d'ancrage au sol (les pieds)
- Le positionnement variait selon la direction (particulièrement les directions flippées)

---

## 🔍 Diagnostic

### Sources de vérité utilisées
1. **Nitro Renderer** (`/references/nitro-renderer/`) - Référence principale
2. **Nitro Imager** (`/references/nitro-imager/`) - Logique de rendu d'avatar
3. **Assets JSON** - Métadonnées des sprites Habbo

### Fichiers clés analysés
- `nitro-imager/src/app/avatar/cache/AvatarImageCache.ts` (ligne 387-419)
- `nitro-imager/src/app/avatar/cache/ImageData.ts` (ligne 54-57)
- `nitro-imager/src/app/avatar/structure/AvatarCanvas.ts`

---

## 💡 Solution Finale

### 1. Calcul des offsets de sprites

**Fichier :** `src/entities/HabboAvatarSprite.ts` (lignes 135-142)

```typescript
let offsetX = -assetData.x;
let offsetY = -assetData.y;

if (flipped) {
  offsetX = -(offsetX + frameData.width);
}

sprite.setPosition(offsetX, offsetY);
```

**Explication :**
- On inverse les coordonnées du JSON (`-assetData.x`, `-assetData.y`)
- Pour les directions flippées (4, 5, 6), on recalcule X en tenant compte de la largeur du sprite
- Cela permet à chaque partie du corps d'avoir sa propre position relative

**Exemple avec le body (direction 2) :**
- JSON : `x=-22, y=50`
- Calcul : `offsetX = 22, offsetY = -50`
- Résultat : Le sprite est positionné correctement dans le container

**Exemple avec le body (direction 6, flippée) :**
- JSON : `x=-20, y=49`
- Calcul : `offsetX = 20`, puis après flip : `offsetX = -(20 + 24) = -44`
- Résultat : Le sprite flippé est bien positionné

### 2. Positionnement du container global

**Fichier :** `src/entities/HabboAvatarSprite.ts` (lignes 257-266)

```typescript
private updateScreenPosition(): void {
  const screenPos = IsometricEngine.tileToScreen(
    this.position.x,
    this.position.y,
    this.position.z
  );

  const isFlipped = (this.direction === 4 || this.direction === 5 || this.direction === 6);
  const MANUAL_OFFSET_X = isFlipped ? 30 : -35;
  const MANUAL_OFFSET_Y = 0;

  const containerX = screenPos.x + MANUAL_OFFSET_X;
  const containerY = screenPos.y + MANUAL_OFFSET_Y;

  this.container.setPosition(containerX, containerY);
}
```

**Explication :**
- On ajuste la position globale du container pour aligner les pieds avec le point au sol
- L'offset change selon la direction (flippée ou non) à cause du calcul de flip
- **Directions normales (0,1,2,3,7)** : `MANUAL_OFFSET_X = -35`
- **Directions flippées (4,5,6)** : `MANUAL_OFFSET_X = 30`

### 3. Positionnement du nom d'utilisateur

**Fichier :** `src/entities/HabboAvatarSprite.ts` (lignes 56 et 159-160)

```typescript
// Dans le constructor
this.nameText = scene.add.text(0, -85, username, { ... });

// Dans updateSprite()
const nameOffsetX = flipped ? -30 : 35;
this.nameText.setX(nameOffsetX);
```

**Explication :**
- Le nom est positionné à Y=-85 pour être au-dessus de la tête
- La position X s'ajuste dynamiquement selon la direction pour compenser le MANUAL_OFFSET

---

## 📊 Formules Importantes

### Conversion des offsets Nitro → Phaser

**Nitro (ligne 387) :**
```typescript
const offset = new Point(-(asset.x), -(asset.y));
```

**Notre implémentation :**
```typescript
let offsetX = -assetData.x;
let offsetY = -assetData.y;
```

### Gestion du flip horizontal

**Nitro (ligne 454) :**
```typescript
if(isFlipped) regPoint.x = (canvas.width - (regPoint.x + data.rect.width));
```

**Notre implémentation simplifiée :**
```typescript
if (flipped) {
  offsetX = -(offsetX + frameData.width);
}
```

---

## 🎨 Structure des Sprites

Chaque avatar Habbo est composé de 4 parties principales :

| Partie | Code | Exemple d'offset (dir 2) | Rôle |
|--------|------|--------------------------|------|
| Body | `bd` | x=-22, y=50 | Torse de l'avatar |
| Head | `hd` | x=-20, y=74 | Tête (24px plus bas que body) |
| Left Hand | `lh` | x=-43, y=47 | Bras gauche |
| Right Hand | `rh` | x=-18, y=44 | Bras droit |

**Note :** Les offsets Y plus élevés = plus bas visuellement (système de coordonnées canvas)

---

## 🔧 Directions et Flip

### Mapping des directions

```typescript
// Directions 0-7 (sens horaire depuis le bas)
// 0 = Sud (bas)
// 1 = Sud-Est
// 2 = Est (droite)
// 3 = Nord-Est
// 4 = Nord (haut) → FLIPPED (utilise sprites de direction 2)
// 5 = Nord-Ouest → FLIPPED (utilise sprites de direction 1)
// 6 = Ouest (gauche) → FLIPPED (utilise sprites de direction 0)
// 7 = Sud-Ouest
```

**Code de détection du flip :**
```typescript
let actualDirection = this.direction;
let flipped = false;

if (this.direction === 4) {
  actualDirection = 2;
  flipped = true;
} else if (this.direction === 5) {
  actualDirection = 1;
  flipped = true;
} else if (this.direction === 6) {
  actualDirection = 0;
  flipped = true;
}
```

---

## 🐛 Pièges Évités

### ❌ Erreur 1 : Appliquer un offset fixe de +65 pour le flip
```typescript
// INCORRECT (essayé initialement)
if (flipped) {
  offsetX = offsetX + 65;
}
```
**Problème :** Ça fonctionne pour certaines parties mais pas toutes (les bras partaient en vrille)

### ✅ Solution : Calculer selon la largeur réelle de chaque sprite
```typescript
// CORRECT
if (flipped) {
  offsetX = -(offsetX + frameData.width);
}
```

### ❌ Erreur 2 : Utiliser `canvas.height - 16` dans le calcul d'offset
```typescript
// INCORRECT (essayé initialement)
const CANVAS_OFFSET = 120 - 16;
let offsetY = CANVAS_OFFSET - assetData.y - frameData.height;
```
**Problème :** Compliquait inutilement le calcul et donnait de mauvais résultats

### ✅ Solution : Formule simple
```typescript
// CORRECT
let offsetY = -assetData.y;
```

### ❌ Erreur 3 : Offset manuel constant pour toutes les directions
```typescript
// INCORRECT
const MANUAL_OFFSET_X = -35; // Pour toutes les directions
```
**Problème :** Les directions flippées étaient mal alignées

### ✅ Solution : Offset adapté selon le flip
```typescript
// CORRECT
const MANUAL_OFFSET_X = isFlipped ? 30 : -35;
```

---

## 📁 Fichiers Modifiés

### Fichier principal
- **`src/entities/HabboAvatarSprite.ts`**
  - Lignes 135-142 : Calcul des offsets de sprites
  - Lignes 159-160 : Positionnement dynamique du nom
  - Lignes 257-266 : Positionnement du container avec offsets manuels

### Fichiers de debug
- **`src/systems/FloorRenderer.ts`** : Suppression des logs de debug du tile (4,4)

### Fichier de scène
- **`src/scenes/RoomScene.ts`** : Ligne 90 - Changement du nom 'Player'

---

## 🎓 Leçons Apprises

1. **Toujours se référer au code source de Nitro** - C'est la source de vérité
2. **Les sprites Phaser ont une origine (0,0) en haut-à-gauche** - Contrairement à certains moteurs
3. **Le flip horizontal nécessite un recalcul de position** - Pas juste un miroir visuel
4. **Chaque partie du corps a des dimensions différentes** - Impossible d'utiliser un offset fixe
5. **Les offsets dans le JSON sont relatifs au canvas Habbo** - Il faut les inverser pour Phaser

---

## 🚀 Prochaines Étapes

### Améliorations possibles
1. **Supprimer les offsets manuels** en comprenant mieux la formule Nitro complète
2. **Ajouter d'autres parties du corps** (jambes, vêtements, accessoires)
3. **Implémenter les animations frame par frame** (actuellement basique)
4. **Gérer les effets visuels** (vagues, particules, etc.)
5. **Optimiser le rendu** (caching des sprites assemblés)

### Fichiers de référence créés
- `AVATAR_SPRITE_POSITIONING.md` - Deep-dive technique
- `AVATAR_OFFSET_DIAGRAMS.md` - Diagrammes visuels
- `AVATAR_OFFSET_QUICK_REFERENCE.md` - Guide de référence rapide
- `AVATAR_RESEARCH_INDEX.md` - Index de la recherche

---

## 📸 État Final

### ✅ Ce qui fonctionne
- ✅ Avatar affiché correctement avec toutes les parties du corps
- ✅ Positionnement aligné avec le point au sol dans toutes les directions
- ✅ Flip horizontal correct pour les directions 4, 5, 6
- ✅ Nom d'utilisateur bien positionné au-dessus de la tête
- ✅ Animations de marche fonctionnelles
- ✅ Pathfinding et déplacement sur les tiles

### 🎯 Formules finales validées

**Pour les sprites individuels :**
```typescript
offsetX = -assetData.x
offsetY = -assetData.y

if (flipped) {
  offsetX = -(offsetX + frameWidth)
}
```

**Pour le container global :**
```typescript
MANUAL_OFFSET_X = isFlipped ? 30 : -35
MANUAL_OFFSET_Y = 0
```

**Pour le nom :**
```typescript
nameY = -85
nameX = flipped ? -30 : 35
```

---

## 💾 Commandes Git (si besoin)

```bash
# Pour voir les changements
git diff src/entities/HabboAvatarSprite.ts

# Pour commit
git add src/entities/HabboAvatarSprite.ts src/systems/FloorRenderer.ts
git commit -m "Fix: Avatar sprite positioning with proper flip handling

- Implement Nitro-compatible offset calculation
- Add dynamic positioning based on direction flip
- Fix name tag alignment for all directions
- Remove debug logs"
```

---

**Session terminée avec succès ! 🎉**

L'avatar Habbo s'affiche maintenant correctement dans toutes les directions avec un positionnement pixel-perfect.
