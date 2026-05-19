/**
 * Transforme une coordonnée de référence (W=1000, H=2100)
 * vers les coordonnées réelles selon W et H variables.
 *
 * @param {object} o       - { x, y, w, h } en coordonnées de référence
 * @param {'left'|'right'} anchorX
 * @param {'top'|'bottom'} anchorY
 * @param {boolean} stretchW
 * @param {boolean} stretchH
 * @param {number} W       - largeur ouvrant courante
 * @param {number} H       - hauteur ouvrant courante
 */
export function t(o, anchorX, anchorY, stretchW, stretchH, W, H) {
  const dW = W - 1000;
  const dH = H - 2100;
  return {
    x: o.x + (anchorX === "right" ? dW : 0),
    y: o.y + (anchorY === "bottom" ? dH : 0),
    w: o.w + (stretchW ? dW : 0),
    h: o.h + (stretchH ? dH : 0),
  };
}

export const SVG_BASE = {
  // ── DORMANT ──────────────────────────────────────────────────────────
  d_mg: { x: 3500, y: 2000, w: 70, h: 2100 },
  d_md: { x: 4430, y: 2000, w: 70, h: 2100 },
  d_th: { x: 3500, y: 2000, w: 1000, h: 70 },
  d_seuil: { x: 3550, y: 4090, w: 900, h: 10 },
  d_cext: { x: 3500.5, y: 2000.5, w: 999, h: 2099 },
  d_cint: { x: 3569.5, y: 2069.5, w: 861, h: 2020.9 },

  // ── OUVRANT PAUMELLES ────────────────────────────────────────────────
  op_rem: { x: 3645, y: 2145, w: 710, h: 1845 },
  op_mg: { x: 3555, y: 2075, w: 90, h: 2005 },
  op_md: { x: 4355, y: 2075, w: 90, h: 2005 },
  op_th: { x: 3555, y: 2055, w: 890, h: 90 },
  op_tb: { x: 3555, y: 3990, w: 890, h: 90 },
  op_cext: { x: 3555.5, y: 2055.5, w: 889, h: 2024 },
  op_cint: { x: 3645.5, y: 2145.5, w: 709, h: 1844 },

  // ── OUVRANT PIVOT-G ──────────────────────────────────────────────────
  og_rem: { x: 3660, y: 2145, w: 695, h: 1845 },
  og_mg: { x: 3570, y: 2055, w: 90, h: 2025 },
  og_md: { x: 4355, y: 2055, w: 90, h: 2025 },
  og_th: { x: 3570, y: 2055, w: 875, h: 90 },
  og_tb: { x: 3570, y: 3990, w: 875, h: 90 },
  og_cext: { x: 3570.5, y: 2055.5, w: 874, h: 2024 },
  og_cint: { x: 3660.5, y: 2145.5, w: 694, h: 1844 },

  // ── OUVRANT PIVOT-D ──────────────────────────────────────────────────
  od_rem: { x: 3645, y: 2145, w: 695, h: 1845 },
  od_mg: { x: 3555, y: 2055, w: 90, h: 2025 },
  od_md: { x: 4340, y: 2055, w: 90, h: 2025 },
  od_th: { x: 3555, y: 2055, w: 875, h: 90 },
  od_tb: { x: 3555, y: 3990, w: 875, h: 90 },
  od_cext: { x: 3555.5, y: 2055.5, w: 874, h: 2024 },
  od_cint: { x: 3645.5, y: 2145.5, w: 694, h: 1844 },

  // ── CONTOURS SYSTÈME PIVOT ───────────────────────────────────────────
  pivot_g: { x: 3570.5, y: 2000.5, w: 69, h: 2079 },
  pivot_d: { x: 4360.2, y: 2000.5, w: 69, h: 2079 },

  // ── PAUMELLES G ──────────────────────────────────────────────────────
  pg: [
    { cx: 3546, cy: 3803, rx: 3546, ry: 3873 },
    { cx: 3546, cy: 3083, rx: 3546, ry: 3153 },
    { cx: 3546, cy: 2446, rx: 3546, ry: 2516 },
    { cx: 3546, cy: 2186, rx: 3546, ry: 2256 },
  ],
  // ── PAUMELLES D ──────────────────────────────────────────────────────
  pd: [
    { cx: 4434, cy: 3803, rx: 4434, ry: 3873 },
    { cx: 4434, cy: 3083, rx: 4434, ry: 3153 },
    { cx: 4434, cy: 2446, rx: 4434, ry: 2516 },
    { cx: 4434, cy: 2186, rx: 4434, ry: 2256 },
  ],

  // ── BÂTON D ──────────────────────────────────────────────────────────
  bd_ph: { x: 4343, y: 2799.5, w: 80, h: 8 },
  bd_pb: { x: 4343, y: 3291.5, w: 80, h: 8 },
  bd_bi: { x: 4345.5, y: 2807.5, w: 38.5, h: 484 },
  bd_pv: { x: 4384, y: 2807.5, w: 22.9, h: 484 },

  // ── BÂTON G ──────────────────────────────────────────────────────────
  bg_ph: { x: 3577, y: 2799.5, w: 80, h: 8 },
  bg_pb: { x: 3577, y: 3291.5, w: 80, h: 8 },
  bg_bi: { x: 3616.75, y: 2807.5, w: 38.5, h: 484 },
  bg_pv: { x: 3593.75, y: 2807.5, w: 22.9, h: 484 },

  // ── BANDEAU VENTOUSE ─────────────────────────────────────────────────
  bvg: { x: 3500.8, y: 2055.8, w: 58.4, h: 2023.4 },
  bvd: { x: 4440.8, y: 2055.8, w: 58.4, h: 2023.4 },
};

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
