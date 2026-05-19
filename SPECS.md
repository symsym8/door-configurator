# SPECS.md — Spécifications techniques du configurateur

## 1. Structure générale

Les éléments s'assemblent de gauche à droite dans l'ordre choisi par l'utilisateur :

```
[CG2] [CG1] [PT-G] [Ouvrant] [PT-D] [CD1] [CD2]
                    + Imposte au-dessus de TOUS les éléments
```

- Max N châssis gauche/droit (pas de limite stricte en code)
- Max 1 poteau technique (gauche ou droite de l'ouvrant)
- L'utilisateur réorganise les éléments avec les flèches ← → du panneau, ou par glisser-déposer depuis le viewer SVG
- L'ouvrant ne peut pas être supprimé (`locked: true`)

---

## 2. Dimensions et limites

| Paramètre       | Min    | Défaut | Max    | Alerte                 |
| --------------- | ------ | ------ | ------ | ---------------------- |
| Largeur ouvrant | 500mm  | 1000mm | 1500mm | > 1350mm → élargisseur |
| Hauteur         | 2000mm | 2100mm | 2400mm | passage libre < 1800mm |
| Largeur châssis | 300mm  | 500mm  | 1000mm | —                      |
| Largeur PT      | 100mm  | 280mm  | 500mm  | —                      |
| Hauteur imposte | 100mm  | 300mm  | 800mm  | —                      |

---

## 3. Passage libre

- **Paumelles** : largeur = ouvrant − 175mm / hauteur = ouvrant − 80mm
- **Pivot** : largeur = ouvrant − 205mm / hauteur = ouvrant − 80mm

---

## 4. Profils fixes (NE JAMAIS DÉFORMER)

```js
// src/constants/profiles.js
export const PROFILES = {
  DORMANT_MONTANT: 70,
  DORMANT_TRAVERSE_H: 70,
  DORMANT_SEUIL: 10,
  DORMANT_SEUIL_OFFSET: 50,
  CHASSIS_MONTANT: 70,
  CHASSIS_TRAVERSE: 70,
  OUVRANT_MONTANT_EXT: 90,
  OUVRANT_TRAVERSE_EXT: 90,
  OUVRANT_MONTANT_INT: 50,
  OUVRANT_TRAVERSE_H_INT: 70,
  OUVRANT_TRAVERSE_B_INT: 90,
  IMPOSTE_MONTANT: 70,
  IMPOSTE_TRAVERSE: 70,
  TRAVERSE_MOBILE: 90,
};
```

---

## 5. État global Zustand (état actuel)

```js
// src/store/useDoorStore.js
{
  // Dimensions ouvrant
  W: 1000,              // largeur ouvrant en mm
  H: 2100,              // hauteur ouvrant en mm

  // Configuration
  ouv: 'ext',           // 'ext' | 'int'
  ferrage: 'paumelles', // 'paumelles' | 'pivot'
  baton: 'd',           // 'g' | 'd' — côté poignée
  fermeture: 'ventouse',// 'ventouse' | 'serrure'

  // Éléments (tableau ordonné gauche → droite)
  elements: [
    { id: 'ouv', type: 'ouvrant', label: 'Ouvrant', w: 1000, locked: true }
    // châssis : { id, type: 'chassis', label, w, locked: false, fill: 'vitrage'|'tole' }
    // pt      : { id, type: 'pt',      label, w, locked: false, fill: 'vitrage' }
  ],
  selectedId: null,     // id de l'élément sélectionné dans le viewer

  // Imposte
  hasImposte: false,
  impH: 300,            // hauteur imposte en mm

  // Traverses mobiles (ouvrant uniquement pour l'instant)
  traversesH: [],       // [{ id: 'th-1', y: 1000 }, ...] — y = mm depuis le sol, max 3
  zoneTypes: ['vitrage'],// type par zone créée (N traverses → N+1 zones)
                        // zoneTypes[0]=bas, zoneTypes[N]=haut

  // Actions
  setW, setH,
  set(key, val),
  setImpH,
  toggleImposte,
  selectElement(id),
  addElement(type),       // 'chassis' | 'pt'
  removeElement(id),
  moveElement(id, dir),   // dir = ±1
  reorderElement(id, insertBeforeId), // drag-and-drop depuis le viewer
  updateElementW(id, w),
  updateElementFill(id, fill),        // 'vitrage' | 'tole'
  addTraverseH(y),        // ajoute traverse à y mm du sol (min dist 90mm)
  removeTraverseH(id),
  updateTraverseH(id, y),
  updateZoneType(idx, type),          // 'vitrage' | 'tole'
  equalizeTraverses(),    // répartit les traverses à hauteurs égales
}
```

---

## 6. Ordre de dessin SVG (layers)

### Vue extérieure

1. Sol (ligne horizontale)
2. Châssis / PT (dans l'ordre de position X)
3. **Ouvrant** :
   - Zone fills (vitrage bleu `#c8e8f8` ou tôle vert `#00ff00`)
   - Dormant (profils verts par-dessus le remplissage)
   - Ventouse (si fermeture = ventouse)
   - Ouvrant ext (par-dessus tout)
   - Zone fills dans l'ouvrant
   - Traverses mobiles (barres 90mm)
   - Paumelles OU contour pivot
   - Bâton maréchal
4. Imposte (au-dessus de TOUS les éléments)
5. Labels des éléments (sous le sol, texte centré)
6. Ligne d'insertion drag-and-drop (pendant le glisser)

### Vue intérieure

1. Sol
2. Châssis / PT
3. **Ouvrant** :
   - Zone fills
   - Ouvrant int (derrière dormant)
   - Traverses mobiles
   - Bâton maréchal
   - Dormant (par-dessus l'ouvrant)
   - Contour pivot si pivot (par-dessus tout)
   - **Pas de paumelles**
   - **Pas de bandeau ventouse**
4. Imposte
5. Labels

---

## 7. Logique automatique quincaillerie

| Réglage             | Résultat automatique                    |
| ------------------- | --------------------------------------- |
| Poignée côté D      | Paumelles côté G                        |
| Poignée côté G      | Paumelles côté D                        |
| Poignée côté D      | Pivot côté G                            |
| Poignée côté D      | Ventouse côté D (même côté que poignée) |
| Fermeture = serrure | Pas de bandeau ventouse                 |
| Vue intérieure      | Pas de paumelles, pas de ventouse       |

---

## 8. Paumelles — positions

Depuis le bas de la traverse haute dormant (`RY + DT`) :

- **P4** (haut) : `refH + 130`
- **P3** : `refH + 130 + 300` (= `refH + 430`)
- **P1** (bas) : `refB - 130 - 146` où `refB = RY + H - DS`
- **P2** : `((P3_y + 146) + P1_y) / 2 - 73` (centré entre P3 et P1)

**X paumelles :**

- Côté G : `RX + 46`
- Côté D : `RX + W - 70 + 4` (dans le montant droit)

**Dimensions paumelle :**

- Corps : 20 × 146mm (vert)
- Rondelle inox : 20 × 6mm à `y + 70` (rouge)

---

## 9. Bâton maréchal — positions

**Ancrage : bas du dormant (800mm du sol), côté fixe**

Depuis SVG de référence (W=1000, H=2100) :

- **Bâton D** : `x = RX + W - 157` (depuis bord droit)
- **Bâton G** : `x = RX + 77` (depuis bord gauche)
- **Y bas plat-bas** : `RY + H - 800 - 8`

Dimensions :

- Plat haut/bas : 80 × 8mm (vert)
- Barre inox : 38.5 × 484mm (rouge)
- Plaque antivandal : 22.9 × 484mm (vert)

---

## 10. Bandeau ventouse — positions

- **Côté D** : `x = RX + W - 59.2`, `w = 58.4`
- **Côté G** : `x = RX + 0.8`, `w = 58.4`
- `y = RY + 55.8`, `h = H - 55.8 - DS`
- Visible seulement en vue extérieure si fermeture = ventouse

---

## 11. Poteau technique (PT)

- Largeur : 100–500mm (défaut 280mm)
- Hauteur = H (même que l'ouvrant)
- **Réservation interphonie** :
  - Dimensions : 145 × 398mm
  - Bas à 900mm du sol : `y = RY + H - 900 - 398`
  - Centrée horizontalement : `x = pt_x + (pt_w - 145) / 2`
  - Style : contour en pointillés (stroke-dasharray="4,2")
- **L'imposte couvre le PT** (comportement actuel — imposte span ALL)

---

## 12. Imposte

- Couvre **TOUS** les éléments y compris le PT
- `impX = Math.min(...positioned.map(p => p.x))`
- `impW = Math.max(...positioned.map(p => p.x + p.w)) - impX`
- Profils 70mm (montants + traverses)
- Hauteur paramétrable (100–800mm)
- Positionnée au-dessus du dormant : `y = RY - impH`
- Remplissage bleu vitrage `#c8e8f8`

---

## 13. Châssis

- Profils 70mm (montants + traverses haut et bas)
- Remplissage vitrage `#c8e8f8` (défaut) ou tôle `#00ff00`
- Switch Vitrage/Tôle affiché dans le viewer (FillSwitch)
- Même hauteur H que l'ouvrant
- Pas de quincaillerie
- Drag-and-drop depuis le viewer SVG pour repositionner

---

## 14. Traverses mobiles (implémentées sur ouvrant uniquement)

- Épaisseur fixe : 90mm
- **Max 3 traverses H sur l'ouvrant** → max 4 zones de remplissage
- Position saisie en mm depuis le bas de l'ouvrant (100mm min, H−180mm max)
- Distance minimale entre deux traverses : 90mm (anti-chevauchement)
- Bouton "Égaliser les zones" : répartit les zones à hauteur égale
- Formule équalization : `zoneH = (H - 280 - 90*N) / (N+1)`, position : `100 + (i+1)*zoneH + i*90`

**Géométrie SVG des traverses :**

- `travInnerLeft` : `3645` (paumelles) ou `3660` (pivot)
- `travInnerWidth` : `710 + dW` (paumelles) ou `695 + dW` (pivot)
- `floorY = RY + H`
- Traverse i : `y = floorY - t.y - 90`, `h = 90`

**Géométrie des zones de remplissage :**

- Zone 0 (bas) : `y = floorY - traversesH[0].y`, `h = traversesH[0].y - 110`
- Zone i (intermédiaire) : `y = floorY - traversesH[i].y`, `h = traversesH[i].y - traversesH[i-1].y - 90`
- Zone haute : `y = innerTopSVG (2145)`, `h = floorY - lastTraverse.y - 90 - innerTopSVG`

---

## 15. Zones de remplissage

- Gérées par `zoneTypes[]` dans le store (N traverses → N+1 zones)
- `zoneTypes[0]` = zone la plus basse, `zoneTypes[N]` = zone la plus haute
- Ajout traverse : scinde la zone à l'index inséré (copie le type existant)
- Suppression traverse : fusionne les deux zones adjacentes (garde le type de la zone basse)
- Switch directement dans le viewer SVG (composant `FillSwitch` — Apple Segmented Control)
- Switch aussi disponible dans le panneau section "Remplissage"

Couleurs d'affichage (maquette) :

- **Vitrage** : `#c8e8f8` (bleu clair)
- **Tôle** : `#00ff00` (vert — même couleur que les profils acier)

---

## 16. Finitions RAL (à implémenter)

| Code     | Couleur                | Hex approx |
| -------- | ---------------------- | ---------- |
| RAL 7024 | Gris graphite (défaut) | #6d7275    |
| RAL 9005 | Noir                   | #0a0a0a    |
| RAL 9016 | Blanc                  | #f4f4f4    |
| RAL 8019 | Gris brun              | #4a3f35    |
| RAL 7016 | Gris anthracite        | #373f43    |

---

## 17. Couleurs SVG de travail (maquette actuelle)

- **Vert** `#00ff00` → profils acier (sera remplacé par la couleur RAL)
- **Bleu clair** `#c8e8f8` → vitrage (remplissages ouvrant, châssis, imposte)
- **Vert** `#00ff00` → tôle pleine (même couleur que profils en maquette)
- **Rouge** (dans SVG_BASE) → éléments inox (seuil, rondelles paumelles, barre bâton)
- **Noir** `#000000` → contours et traits

> Note : en maquette, tôle et profils ont la même couleur verte `#00ff00`.
> En production, les profils prendront la couleur RAL et la tôle une couleur distincte.
