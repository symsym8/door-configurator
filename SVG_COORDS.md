# SVG_COORDS.md — Coordonnées SVG exactes

## Repère de référence

```js
// src/constants/svgRef.js
export const RX = 3500; // X origine dormant dans le repère SVG
export const RY = 2000; // Y origine dormant dans le repère SVG
export const RW = 1000; // Largeur de référence (W=1000mm)
export const RH = 2100; // Hauteur de référence (H=2100mm)
```

Toutes les coordonnées ci-dessous sont dans ce repère SVG (1 unité = 1mm).
Le viewBox SVG est calculé dynamiquement selon les éléments présents.

---

## Fonction de transformation

```js
// src/utils/svgCoords.js

/**
 * Transforme une coordonnée de référence (W=1000, H=2100)
 * vers les coordonnées réelles selon W et H variables.
 *
 * @param {object} o - { x, y, w, h } en coordonnées de référence
 * @param {'left'|'right'} anchorX - ancrage horizontal
 * @param {'top'|'bottom'} anchorY - ancrage vertical
 * @param {boolean} stretchW - l'élément s'étire en largeur
 * @param {boolean} stretchH - l'élément s'étire en hauteur
 * @param {number} W - largeur ouvrant courante
 * @param {number} H - hauteur ouvrant courante
 */
export function t(o, anchorX, anchorY, stretchW, stretchH, W, H) {
  const dW = W - 1000; // delta largeur
  const dH = H - 2100; // delta hauteur
  return {
    x: o.x + (anchorX === "right" ? dW : 0),
    y: o.y + (anchorY === "bottom" ? dH : 0),
    w: o.w + (stretchW ? dW : 0),
    h: o.h + (stretchH ? dH : 0),
  };
}
```

---

## Coordonnées exactes (référence W=1000, H=2100)

Extraites du fichier Inkscape `PORTE_HALL_V4.svg`.

```js
// src/utils/svgCoords.js

export const SVG_BASE = {
  // ── DORMANT ──────────────────────────────────────────────────────────
  // anchorX | anchorY | stretchW | stretchH
  d_mg: { x: 3500, y: 2000, w: 70, h: 2100 }, // left  | top    | false | true
  d_md: { x: 4430, y: 2000, w: 70, h: 2100 }, // right | top    | false | true
  d_th: { x: 3500, y: 2000, w: 1000, h: 70 }, // left  | top    | true  | false
  d_seuil: { x: 3550, y: 4090, w: 900, h: 10 }, // left  | bottom | true  | false
  d_cext: { x: 3500.5, y: 2000.5, w: 999, h: 2099 }, // left  | top    | true  | true
  d_cint: { x: 3569.5, y: 2069.5, w: 861, h: 2020.9 }, // left  | top    | true  | true

  // ── OUVRANT PAUMELLES (layer-ouvrant-paumelles) ──────────────────────
  op_rem: { x: 3645, y: 2145, w: 710, h: 1845 }, // left  | top    | true  | true
  op_mg: { x: 3555, y: 2075, w: 90, h: 2005 }, // left  | top    | false | true
  op_md: { x: 4355, y: 2075, w: 90, h: 2005 }, // right | top    | false | true
  op_th: { x: 3555, y: 2055, w: 890, h: 90 }, // left  | top    | true  | false
  op_tb: { x: 3555, y: 3990, w: 890, h: 90 }, // left  | bottom | true  | false
  op_cext: { x: 3555.5, y: 2055.5, w: 889, h: 2024 }, // left  | top    | true  | true
  op_cint: { x: 3645.5, y: 2145.5, w: 709, h: 1844 }, // left  | top    | true  | true

  // ── OUVRANT PIVOT-G (pivot gauche, poignée droite) ───────────────────
  og_rem: { x: 3660, y: 2145, w: 695, h: 1845 }, // left  | top    | true  | true
  og_mg: { x: 3570, y: 2055, w: 90, h: 2025 }, // left  | top    | false | true
  og_md: { x: 4355, y: 2055, w: 90, h: 2025 }, // right | top    | false | true
  og_th: { x: 3570, y: 2055, w: 875, h: 90 }, // left  | top    | true  | false
  og_tb: { x: 3570, y: 3990, w: 875, h: 90 }, // left  | bottom | true  | false
  og_cext: { x: 3570.5, y: 2055.5, w: 874, h: 2024 }, // left  | top    | true  | true
  og_cint: { x: 3660.5, y: 2145.5, w: 694, h: 1844 }, // left  | top    | true  | true

  // ── OUVRANT PIVOT-D (pivot droit, poignée gauche) ────────────────────
  od_rem: { x: 3645, y: 2145, w: 695, h: 1845 }, // left  | top    | true  | true
  od_mg: { x: 3555, y: 2055, w: 90, h: 2025 }, // left  | top    | false | true
  od_md: { x: 4340, y: 2055, w: 90, h: 2025 }, // right | top    | false | true
  od_th: { x: 3555, y: 2055, w: 875, h: 90 }, // left  | top    | true  | false
  od_tb: { x: 3555, y: 3990, w: 875, h: 90 }, // left  | bottom | true  | false
  od_cext: { x: 3555.5, y: 2055.5, w: 874, h: 2024 }, // left  | top    | true  | true
  od_cint: { x: 3645.5, y: 2145.5, w: 694, h: 1844 }, // left  | top    | true  | true

  // ── CONTOURS SYSTÈME PIVOT (layer-pivot) ─────────────────────────────
  // Trait plein stroke-width:1.5 — visible vue ext ET int
  pivot_g: { x: 3570.5, y: 2000.5, w: 69, h: 2079 }, // left  | top    | false | true
  pivot_d: { x: 4360.2, y: 2000.5, w: 69, h: 2079 }, // right | top    | false | true

  // ── PAUMELLES ────────────────────────────────────────────────────────
  // Positions Y ancrées bas (depuis bas dormant = RY+H)
  // Corps: w=20, h=146 | Rondelle: w=20, h=6 à y+70
  // X G: RX+46 | X D: RX+W-70+4 (dans montant droit)
  // Calcul Y dynamique — voir paumellesCalc.js

  // Paumelles G — x=3546 (RX+46)
  pg: [
    { cx: 3546, cy: 3803, rx: 3546, ry: 3873 }, // P1 bas   (3042+761=3803)
    { cx: 3546, cy: 3083, rx: 3546, ry: 3153 }, // P2       (3042+41=3083)
    { cx: 3546, cy: 2446, rx: 3546, ry: 2516 }, // P3       (3042-596=2446)
    { cx: 3546, cy: 2186, rx: 3546, ry: 2256 }, // P4 haut  (3042-856=2186)
  ],
  // Paumelles D — x=4434 (RX+W-70+4 = 4434 pour W=1000)
  pd: [
    { cx: 4434, cy: 3803, rx: 4434, ry: 3873 }, // P1 bas
    { cx: 4434, cy: 3083, rx: 4434, ry: 3153 }, // P2
    { cx: 4434, cy: 2446, rx: 4434, ry: 2516 }, // P3
    { cx: 4434, cy: 2186, rx: 4434, ry: 2256 }, // P4 haut
  ],

  // ── BÂTON D (translate 2542.25, 798.75 dans SVG original) ────────────
  // Ancre: right + bottom (x depuis bord droit, y depuis bas dormant)
  bd_ph: { x: 4343, y: 2799.5, w: 80, h: 8 }, // right | bottom | false | false
  bd_pb: { x: 4343, y: 3291.5, w: 80, h: 8 }, // right | bottom | false | false
  bd_bi: { x: 4345.5, y: 2807.5, w: 38.5, h: 484 }, // right | bottom | false | false
  bd_pv: { x: 4384, y: 2807.5, w: 22.9, h: 484 }, // right | bottom | false | false

  // ── BÂTON G (translate 1776.25, 798.75 dans SVG original) ────────────
  // Ancre: left + bottom
  bg_ph: { x: 3577, y: 2799.5, w: 80, h: 8 }, // left  | bottom | false | false
  bg_pb: { x: 3577, y: 3291.5, w: 80, h: 8 }, // left  | bottom | false | false
  bg_bi: { x: 3616.75, y: 2807.5, w: 38.5, h: 484 }, // left  | bottom | false | false
  bg_pv: { x: 3593.75, y: 2807.5, w: 22.9, h: 484 }, // left  | bottom | false | false

  // ── BANDEAU VENTOUSE ─────────────────────────────────────────────────
  // Ancre: left/right + top | s'étire en hauteur
  bvg: { x: 3500.8, y: 2055.8, w: 58.4, h: 2023.4 }, // left  | top    | false | true
  bvd: { x: 4440.8, y: 2055.8, w: 58.4, h: 2023.4 }, // right | top    | false | true
};
```

---

## Table des ancrages complète

```js
// src/utils/svgCoords.js

export const SVG_ANCHORS = {
  d_mg: ["left", "top", false, true],
  d_md: ["right", "top", false, true],
  d_th: ["left", "top", true, false],
  d_seuil: ["left", "bottom", true, false],
  d_cext: ["left", "top", true, true],
  d_cint: ["left", "top", true, true],
  op_rem: ["left", "top", true, true],
  op_mg: ["left", "top", false, true],
  op_md: ["right", "top", false, true],
  op_th: ["left", "top", true, false],
  op_tb: ["left", "bottom", true, false],
  op_cext: ["left", "top", true, true],
  op_cint: ["left", "top", true, true],
  og_rem: ["left", "top", true, true],
  og_mg: ["left", "top", false, true],
  og_md: ["right", "top", false, true],
  og_th: ["left", "top", true, false],
  og_tb: ["left", "bottom", true, false],
  og_cext: ["left", "top", true, true],
  og_cint: ["left", "top", true, true],
  od_rem: ["left", "top", true, true],
  od_mg: ["left", "top", false, true],
  od_md: ["right", "top", false, true],
  od_th: ["left", "top", true, false],
  od_tb: ["left", "bottom", true, false],
  od_cext: ["left", "top", true, true],
  od_cint: ["left", "top", true, true],
  pivot_g: ["left", "top", false, true],
  pivot_d: ["right", "top", false, true],
  bd_ph: ["right", "bottom", false, false],
  bd_pb: ["right", "bottom", false, false],
  bd_bi: ["right", "bottom", false, false],
  bd_pv: ["right", "bottom", false, false],
  bg_ph: ["left", "bottom", false, false],
  bg_pb: ["left", "bottom", false, false],
  bg_bi: ["left", "bottom", false, false],
  bg_pv: ["left", "bottom", false, false],
  bvg: ["left", "top", false, true],
  bvd: ["right", "top", false, true],
};
```

---

## Calcul paumelles (positions dynamiques)

```js
// src/utils/paumellesCalc.js

/**
 * Calcule les positions Y des 4 paumelles selon H.
 * @param {number} H - hauteur courante de l'ouvrant
 * @returns {number[]} [p4y, p3y, p2y, p1y] — Y du haut de chaque paumelle
 */
export function calcPaumelles(H) {
  const RY = 2000;
  const DT = 70; // traverse haute dormant
  const DS = 10; // seuil
  const PAUM_H = 146;

  const refH = RY + DT; // bas traverse haute dormant
  const refB = RY + H - DS; // haut seuil

  const p4y = refH + 130;
  const p3y = refH + 130 + 300;
  const p1y = refB - 130 - PAUM_H;
  const p2y = (p3y + PAUM_H + p1y) / 2 - PAUM_H / 2;

  return [p4y, p3y, p2y, p1y];
}

/**
 * Calcule le X des paumelles selon le côté et W.
 */
export function calcPaumellesX(side, W) {
  const RX = 3500;
  const DM = 70;
  return side === "g" ? RX + 46 : RX + W - DM + 4;
}
```

---

## Décalage d'un élément (ouvrant non à RX)

Si l'ouvrant n'est pas en première position, appliquer un `<g transform="translate(shift, 0)">` :

```jsx
const shift = ouvrantX - RX; // ouvrantX = position X réelle de l'ouvrant
// Dans le JSX :
<g transform={shift !== 0 ? `translate(${shift}, 0)` : undefined}>
  {/* tous les éléments SVG de l'ouvrant */}
</g>;
```

Les coordonnées SVG de l'ouvrant restent absolues (repère RX=3500) — le translate gère le décalage.

---

## Châssis — coordonnées calculées

Les châssis n'ont pas de coordonnées SVG fixes — ils sont calculés depuis leur position X :

```js
function drawChassis(ox, ew, H) {
  const CM = 70,
    CT = 70;
  const RY = 2000;
  return {
    rem: { x: ox + CM, y: RY + CT, w: ew - 2 * CM, h: H - 2 * CT },
    mg: { x: ox, y: RY, w: CM, h: H },
    md: { x: ox + ew - CM, y: RY, w: CM, h: H },
    th: { x: ox, y: RY, w: ew, h: CT },
    tb: { x: ox, y: RY + H - CT, w: ew, h: CT },
    cext: { x: ox, y: RY, w: ew, h: H },
    cint: { x: ox + CM, y: RY + CT, w: ew - 2 * CM, h: H - 2 * CT },
  };
}
```

---

## PT — coordonnées calculées

```js
function drawPT(ox, ew, H) {
  const RY = 2000;
  return {
    corps: { x: ox, y: RY, w: ew, h: H },
    // Réservation interphonie : fixe en mm depuis le sol
    interphonie: {
      x: ox + (ew - 145) / 2,
      y: RY + H - 900 - 398, // bas à 900mm du sol
      w: 145,
      h: 398,
    },
  };
}
```

---

## Imposte — coordonnées calculées

```js
function drawImposte(impX, impW, impH) {
  const RY = 2000;
  const IM = 70; // profil imposte
  const impY = RY - impH;
  return {
    rem: { x: impX + IM, y: impY + IM, w: impW - 2 * IM, h: impH - 2 * IM },
    mg: { x: impX, y: impY, w: IM, h: impH },
    md: { x: impX + impW - IM, y: impY, w: IM, h: impH },
    th: { x: impX, y: impY, w: impW, h: IM },
    tb: { x: impX, y: impY + impH - IM, w: impW, h: IM },
    cext: { x: impX, y: impY, w: impW, h: impH },
    cint: { x: impX + IM, y: impY + IM, w: impW - 2 * IM, h: impH - 2 * IM },
  };
}
// Calcul dans DoorViewer.jsx :
// impX = Math.min(...positioned.map(p => p.x))          — couvre TOUS les éléments y compris PT
// impW = Math.max(...positioned.map(p => p.x + p.w)) - impX
```
