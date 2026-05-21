import { create } from "zustand";
import { calcImpW } from "../utils/impUtils";

let _travN = 0;
let _subTravN = 0;
let _impN = 0;

function equalizedPos(existingCount, innerSize, barSize = 70) {
  const N = existingCount + 1;
  const available = Math.max(0, innerSize - barSize * N);
  const zoneSize = available / (N + 1);
  return Array.from({ length: N }, (_, i) =>
    Math.round(zoneSize * (i + 1) + barSize * i),
  );
}

function buildSubZones(nRows, nCols, defaultType = "vitrage") {
  const sz = {};
  for (let r = 0; r < nRows; r++)
    for (let c = 0; c < nCols; c++) sz[`${r}_${c}`] = defaultType;
  return sz;
}

// Insère une rangée ou colonne dans subZones sans effacer les remplissages existants.
// insertIdx = index (0-based) de la nouvelle traverse dans le tableau trié final.
function preserveSubZonesInsert(
  oldSZ,
  axis,
  insertIdx,
  nRows,
  nCols,
  defaultFill,
) {
  const sz = {};
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      let or = r,
        oc = c;
      if (axis === "h") {
        if (r > insertIdx + 1) or = r - 1;
        else if (r === insertIdx + 1) or = insertIdx;
      } else {
        if (c > insertIdx + 1) oc = c - 1;
        else if (c === insertIdx + 1) oc = insertIdx;
      }
      sz[`${r}_${c}`] = oldSZ[`${or}_${oc}`] ?? defaultFill;
    }
  }
  return sz;
}

// Supprime une rangée ou colonne de subZones sans effacer les remplissages des zones restantes.
// removeIdx = index (0-based) de la traverse supprimée dans le tableau trié d'origine.
function preserveSubZonesRemove(
  oldSZ,
  axis,
  removeIdx,
  nRows,
  nCols,
  defaultFill,
) {
  const sz = {};
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      let or = r,
        oc = c;
      if (axis === "h") {
        if (r > removeIdx) or = r + 1;
      } else {
        if (c > removeIdx) oc = c + 1;
      }
      sz[`${r}_${c}`] = oldSZ[`${or}_${oc}`] ?? defaultFill;
    }
  }
  return sz;
}

// Cherche la plus grande zone libre et retourne la position de la nouvelle traverse dans son centre.
function bestInsertPos(sorted, innerSize, barSize = 90) {
  let prev = 0;
  let bestStart = 0;
  let bestSize = -1;
  let bestIdx = 0;
  for (let i = 0; i <= sorted.length; i++) {
    const end = i < sorted.length ? sorted[i].pos : innerSize;
    const size = end - prev;
    if (size > bestSize) {
      bestSize = size;
      bestStart = prev;
      bestIdx = i;
    }
    if (i < sorted.length) prev = sorted[i].pos + barSize;
  }
  return {
    pos: Math.round(bestStart + (bestSize - barSize) / 2),
    insertIdx: bestIdx,
  };
}

function makeImposte(elements, row, h = 300) {
  _impN++;
  return {
    id: `imp-${_impN}`,
    row,
    h,
    coveredIds: elements.map((e) => e.id),
    travH: [],
    travV: [],
    subZones: { "0_0": "vitrage" },
  };
}

// Reproduit le layout positionné (même logique que DoorViewer.computeLayout)
function computePositioned(elements, ouvW, RX_VAL) {
  const ouvIdx = elements.findIndex((e) => e.type === "ouvrant");
  if (ouvIdx < 0) return elements.map((e) => ({ ...e, x: RX_VAL }));
  const result = new Array(elements.length);
  result[ouvIdx] = { ...elements[ouvIdx], x: RX_VAL };
  let leftX = RX_VAL;
  for (let i = ouvIdx - 1; i >= 0; i--) {
    leftX -= elements[i].w;
    result[i] = { ...elements[i], x: leftX };
  }
  let rightX = RX_VAL + ouvW;
  for (let i = ouvIdx + 1; i < elements.length; i++) {
    result[i] = { ...elements[i], x: rightX };
    rightX += elements[i].w;
  }
  return result;
}

const useDoorStore = create((set) => ({
  W: 1000,
  H: 2100,
  ouv: "ext",
  ferrage: "paumelles",
  baton: "d",
  fermeture: "ventouse",
  fermePorte: "ts93",
  profil: "acier50",
  vitrage: "STADIP 44.2",
  elements: [
    { id: "ouv", type: "ouvrant", label: "Ouvrant", w: 1000, locked: true },
  ],
  selectedId: null,
  hasOuvrant: false,
  traversesH: [],
  zoneTypes: ["vitrage"],
  impostes: [], // [{ id, row: 0|1, h, coveredIds, travH, travV, subZones }]
  elargisseursH: [],
  ralColor: "#373f43",
  strokeColor: "#ffffff",

  toggleElargisseurH: () =>
    set((s) => {
      if (s.elargisseursH.length > 0)
        return { elargisseursH: [], selectedId: null };
      const newElh = { id: `elh-${Date.now()}`, h: 100, position: "above" };
      return { elargisseursH: [newElh], selectedId: newElh.id };
    }),

  setElargisseurHH: (id, h) =>
    set((s) => ({
      elargisseursH: s.elargisseursH.map((e) =>
        e.id === id ? { ...e, h } : e,
      ),
    })),

  setElargisseurHPosition: (id, position) =>
    set((s) => ({
      elargisseursH: s.elargisseursH.map((e) =>
        e.id === id ? { ...e, position } : e,
      ),
    })),

  setW: (W) =>
    set((s) => {
      const newElements = s.elements.map((e) =>
        e.type === "ouvrant" ? { ...e, w: W } : e,
      );
      const scaledImpostes = s.impostes.map((imp) => {
        const oldW = calcImpW(imp, s.elements, s.hasOuvrant);
        const newW = calcImpW(imp, newElements, s.hasOuvrant);
        const oldInnerW = oldW - 140;
        const newInnerW = newW - 140;
        if (oldInnerW <= 0 || !imp.travV?.length) return imp;
        return {
          ...imp,
          travV: imp.travV.map((t) => ({
            ...t,
            pos: Math.round((t.pos * newInnerW) / oldInnerW),
          })),
        };
      });
      return { W, elements: newElements, impostes: scaledImpostes };
    }),
  setH: (H) => set({ H }),
  set: (key, val) => set({ [key]: val }),
  setRalColor: (ralColor) => {
    const r = parseInt(ralColor.slice(1, 3), 16);
    const g = parseInt(ralColor.slice(3, 5), 16);
    const b = parseInt(ralColor.slice(5, 7), 16);
    const strokeColor =
      r * 0.299 + g * 0.587 + b * 0.114 > 128 ? "#000000" : "#ffffff";
    set({ ralColor, strokeColor });
  },
  selectElement: (id) => set({ selectedId: id }),
  toggleOuvrant: () =>
    set((s) => ({
      hasOuvrant: !s.hasOuvrant,
      selectedId: !s.hasOuvrant ? "ouv" : s.selectedId,
    })),

  // ── Traverses ouvrant ─────────────────────────────
  addTraverseH: (y) =>
    set((s) => {
      if (s.traversesH.some((t) => Math.abs(t.y - y) < 100)) return s;
      _travN += 1;
      const id = `th-${_travN}`;
      const newArr = [...s.traversesH, { id, y }].sort((a, b) => a.y - b.y);
      const insertedIdx = newArr.findIndex((t) => t.id === id);
      const zt = [...s.zoneTypes];
      zt.splice(insertedIdx + 1, 0, zt[insertedIdx] || "vitrage");
      return { traversesH: newArr, zoneTypes: zt };
    }),

  addTraverseEqualized: () =>
    set((s) => {
      _travN += 1;
      const id = `th-${_travN}`;
      const N = s.traversesH.length + 1;
      const totalRange = s.H - 365;
      const zoneH = Math.max(0, (totalRange - 90 * N) / (N + 1));
      const all = [...s.traversesH, { id, y: 0 }].sort((a, b) => a.y - b.y);
      const newTraverses = all.map((t, i) => ({
        ...t,
        y: Math.round(120 + (i + 1) * zoneH + i * 90),
      }));
      const parentType = s.zoneTypes[0] || "vitrage";
      const zt = Array(N + 1).fill(parentType);
      return { traversesH: newTraverses, zoneTypes: zt };
    }),

  removeTraverseH: (id) =>
    set((s) => {
      const idx = s.traversesH.findIndex((t) => t.id === id);
      const zt = [...s.zoneTypes];
      zt.splice(idx + 1, 1);
      return {
        traversesH: s.traversesH.filter((t) => t.id !== id),
        zoneTypes: zt,
      };
    }),

  updateTraverseH: (id, y) =>
    set((s) => {
      if (s.traversesH.some((t) => t.id !== id && Math.abs(t.y - y) < 100))
        return s;
      return {
        traversesH: s.traversesH
          .map((t) => (t.id === id ? { ...t, y } : t))
          .sort((a, b) => a.y - b.y),
      };
    }),

  updateZoneType: (idx, type) =>
    set((s) => {
      const zt = [...s.zoneTypes];
      zt[idx] = type;
      return { zoneTypes: zt };
    }),

  equalizeTraverses: () =>
    set((s) => {
      const N = s.traversesH.length;
      if (N === 0) return s;
      const totalRange = s.H - 365;
      const zoneH = Math.max(0, (totalRange - 90 * N) / (N + 1));
      const sorted = [...s.traversesH].sort((a, b) => a.y - b.y);
      const newTraverses = sorted.map((t, i) => ({
        ...t,
        y: Math.round(120 + (i + 1) * zoneH + i * 90),
      }));
      return { traversesH: newTraverses };
    }),

  layoutQuarterHalf: () =>
    set((s) => {
      if (s.traversesH.length !== 2) return s;
      const clamp = (v) => Math.max(120, Math.min(s.H - 245, v));
      const sorted = [...s.traversesH].sort((a, b) => a.y - b.y);
      const positions = [Math.round(s.H / 4), Math.round(s.H / 2)];
      const newTraverses = sorted.map((t, i) => ({
        ...t,
        y: clamp(positions[i]),
      }));
      return { traversesH: newTraverses };
    }),

  // ── Traverses châssis ─────────────────────────────
  addChassisTraverseH: (elId) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el || (el.travH?.length || 0) >= 3) return s;
      const innerH = (el.h ?? s.H) - 140;
      const N = (el.travH?.length || 0) + 1;
      if (innerH < N * 90 + (N + 1) * 10) return s;
      const sorted = [...(el.travH || [])].sort((a, b) => a.pos - b.pos);
      const { pos, insertIdx } = bestInsertPos(sorted, innerH);
      _subTravN++;
      const newTravH = [...sorted, { id: `cht-${_subTravN}`, pos }].sort(
        (a, b) => a.pos - b.pos,
      );
      const nRows = newTravH.length + 1;
      const nCols = (el.travV?.length || 0) + 1;
      const subZones = preserveSubZonesInsert(
        el.subZones || {},
        "h",
        insertIdx,
        nRows,
        nCols,
        el.fill || "vitrage",
      );
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, travH: newTravH, subZones } : e,
        ),
      };
    }),

  addChassisTraverseV: (elId) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el || (el.travV?.length || 0) >= 3) return s;
      const innerW = el.w - 140;
      const N = (el.travV?.length || 0) + 1;
      if (innerW < N * 90 + (N + 1) * 10) return s;
      const sorted = [...(el.travV || [])].sort((a, b) => a.pos - b.pos);
      const { pos, insertIdx } = bestInsertPos(sorted, innerW);
      _subTravN++;
      const newTravV = [...sorted, { id: `cvt-${_subTravN}`, pos }].sort(
        (a, b) => a.pos - b.pos,
      );
      const nRows = (el.travH?.length || 0) + 1;
      const nCols = newTravV.length + 1;
      const subZones = preserveSubZonesInsert(
        el.subZones || {},
        "v",
        insertIdx,
        nRows,
        nCols,
        el.fill || "vitrage",
      );
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, travV: newTravV, subZones } : e,
        ),
      };
    }),

  removeChassisTraverse: (elId, axis, travId) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el) return s;
      const key = axis === "h" ? "travH" : "travV";
      const sortedOld = [...(el[key] || [])].sort((a, b) => a.pos - b.pos);
      const removeIdx = sortedOld.findIndex((t) => t.id === travId);
      const newTrav = sortedOld.filter((t) => t.id !== travId);
      const travH = axis === "h" ? newTrav : el.travH || [];
      const travV = axis === "v" ? newTrav : el.travV || [];
      const nRows = travH.length + 1;
      const nCols = travV.length + 1;
      const subZones = preserveSubZonesRemove(
        el.subZones || {},
        axis,
        removeIdx,
        nRows,
        nCols,
        el.fill || "vitrage",
      );
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, [key]: newTrav, subZones } : e,
        ),
      };
    }),

  updateChassisTraverse: (elId, axis, travId, pos) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el) return s;
      const key = axis === "h" ? "travH" : "travV";
      const others = (el[key] || []).filter((t) => t.id !== travId);
      if (others.some((t) => Math.abs(t.pos - pos) < 100)) return s;
      const arr = (el[key] || [])
        .map((t) => (t.id === travId ? { ...t, pos } : t))
        .sort((a, b) => a.pos - b.pos);
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, [key]: arr } : e,
        ),
      };
    }),

  equalizeChassisTraverses: (elId, axis) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el) return s;
      const key = axis === "h" ? "travH" : "travV";
      const existing = el[key] || [];
      if (existing.length === 0) return s;
      const innerSize = axis === "h" ? (el.h ?? s.H) - 140 : el.w - 140;
      const positions = equalizedPos(existing.length - 1, innerSize, 90);
      const sorted = [...existing].sort((a, b) => a.pos - b.pos);
      const newTrav = sorted.map((t, i) => ({ ...t, pos: positions[i] }));
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, [key]: newTrav } : e,
        ),
      };
    }),

  syncChassisToPorte: (elId) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === elId);
      if (!el || s.traversesH.length === 0) return s;
      const newTravH = s.traversesH
        .map((t) => {
          _subTravN++;
          return { id: `cht-${_subTravN}`, pos: s.H - t.y - 160 };
        })
        .sort((a, b) => a.pos - b.pos);
      const nRows = newTravH.length + 1;
      const nCols = (el.travV?.length || 0) + 1;
      const subZones = buildSubZones(nRows, nCols, el.fill || "vitrage");
      return {
        elements: s.elements.map((e) =>
          e.id === elId ? { ...e, travH: newTravH, subZones } : e,
        ),
      };
    }),

  updateChassisSubZone: (elId, zoneKey, type) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === elId
          ? { ...e, subZones: { ...(e.subZones || {}), [zoneKey]: type } }
          : e,
      ),
    })),

  // ── Impostes (tableau unifié) ──────────────────────
  toggleImposteRow: (row) =>
    set((s) => {
      const rowImpostes = s.impostes.filter((i) => i.row === row);
      if (rowImpostes.length === 0) {
        const newImp = makeImposte(s.elements, row);
        return { impostes: [...s.impostes, newImp], selectedId: newImp.id };
      }
      // Supprimer la rangée (et la rangée 1 si on supprime la rangée 0)
      const toRemove = row === 0 ? [0, 1] : [1];
      return { impostes: s.impostes.filter((i) => !toRemove.includes(i.row)) };
    }),

  removeImposte: (id) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      let filtered = s.impostes.filter((i) => i.id !== id);
      // Si on supprime la dernière imposte row=0, supprimer aussi row=1
      if (imp.row === 0 && !filtered.some((i) => i.row === 0)) {
        filtered = filtered.filter((i) => i.row !== 1);
      }
      return { impostes: filtered };
    }),

  setImposteH: (id, h) =>
    set((s) => ({
      impostes: s.impostes.map((i) => (i.id === id ? { ...i, h } : i)),
    })),

  // Divise une imposte en une imposte par élément couvert
  splitImposte: (id) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const covered = s.elements.filter(
        (e) =>
          imp.coveredIds.includes(e.id) &&
          !(e.type === "ouvrant" && !s.hasOuvrant),
      );
      if (covered.length <= 1) return s;
      const newImpostes = covered.map((el) => {
        _impN++;
        return {
          id: `imp-${_impN}`,
          row: imp.row,
          h: imp.h,
          coveredIds: [el.id],
          travH: [],
          travV: [],
          subZones: { "0_0": "vitrage" },
        };
      });
      return {
        impostes: [...s.impostes.filter((i) => i.id !== id), ...newImpostes],
      };
    }),

  // Fusionne toutes les impostes de la même rangée en une seule
  mergeImposteRow: (row) =>
    set((s) => {
      const rowImpostes = s.impostes.filter((i) => i.row === row);
      if (rowImpostes.length <= 1) return s;
      const allCoveredIds = [
        ...new Set(rowImpostes.flatMap((i) => i.coveredIds)),
      ];
      const maxH = Math.max(...rowImpostes.map((i) => i.h));
      _impN++;
      const merged = {
        id: `imp-${_impN}`,
        row,
        h: maxH,
        coveredIds: allCoveredIds,
        travH: [],
        travV: [],
        subZones: { "0_0": "vitrage" },
      };
      return {
        impostes: [...s.impostes.filter((i) => i.row !== row), merged],
      };
    }),

  swapImposteRows: () =>
    set((s) => ({
      impostes: s.impostes.map((i) => ({ ...i, row: i.row === 0 ? 1 : 0 })),
    })),

  // ── Traverses imposte (génériques par id) ─────────
  addImpTravH: (id) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp || (imp.travH?.length || 0) >= 3) return s;
      const innerH = imp.h - 140;
      const N = (imp.travH?.length || 0) + 1;
      if (innerH < N * 90 + (N + 1) * 10) return s;
      const sorted = [...(imp.travH || [])].sort((a, b) => a.pos - b.pos);
      const { pos, insertIdx } = bestInsertPos(sorted, innerH);
      _subTravN++;
      const newTravH = [...sorted, { id: `iht-${_subTravN}`, pos }].sort(
        (a, b) => a.pos - b.pos,
      );
      const nRows = newTravH.length + 1;
      const nCols = (imp.travV?.length || 0) + 1;
      const subZones = preserveSubZonesInsert(
        imp.subZones || {},
        "h",
        insertIdx,
        nRows,
        nCols,
        "vitrage",
      );
      return {
        impostes: s.impostes.map((i) =>
          i.id === id ? { ...i, travH: newTravH, subZones } : i,
        ),
      };
    }),

  addImpTravV: (id, impW) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp || (imp.travV?.length || 0) >= 8) return s;
      const innerW = impW - 140;
      const N = (imp.travV?.length || 0) + 1;
      if (innerW < N * 90 + (N + 1) * 10) return s;
      const sorted = [...(imp.travV || [])].sort((a, b) => a.pos - b.pos);
      const { pos, insertIdx } = bestInsertPos(sorted, innerW);
      _subTravN++;
      const newTravV = [...sorted, { id: `ivt-${_subTravN}`, pos }].sort(
        (a, b) => a.pos - b.pos,
      );
      const nRows = (imp.travH?.length || 0) + 1;
      const nCols = newTravV.length + 1;
      const subZones = preserveSubZonesInsert(
        imp.subZones || {},
        "v",
        insertIdx,
        nRows,
        nCols,
        "vitrage",
      );
      return {
        impostes: s.impostes.map((i) =>
          i.id === id ? { ...i, travV: newTravV, subZones } : i,
        ),
      };
    }),

  removeImpTrav: (id, axis, travId) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const key = axis === "h" ? "travH" : "travV";
      const sortedOld = [...(imp[key] || [])].sort((a, b) => a.pos - b.pos);
      const removeIdx = sortedOld.findIndex((t) => t.id === travId);
      const newTrav = sortedOld.filter((t) => t.id !== travId);
      const travH = axis === "h" ? newTrav : imp.travH || [];
      const travV = axis === "v" ? newTrav : imp.travV || [];
      const nRows = travH.length + 1;
      const nCols = travV.length + 1;
      const subZones = preserveSubZonesRemove(
        imp.subZones || {},
        axis,
        removeIdx,
        nRows,
        nCols,
        "vitrage",
      );
      return {
        impostes: s.impostes.map((i) =>
          i.id === id ? { ...i, [key]: newTrav, subZones } : i,
        ),
      };
    }),

  updateImpTrav: (id, axis, travId, pos) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const key = axis === "h" ? "travH" : "travV";
      const others = (imp[key] || []).filter((t) => t.id !== travId);
      if (others.some((t) => Math.abs(t.pos - pos) < 100)) return s;
      const arr = (imp[key] || [])
        .map((t) => (t.id === travId ? { ...t, pos } : t))
        .sort((a, b) => a.pos - b.pos);
      return {
        impostes: s.impostes.map((i) =>
          i.id === id ? { ...i, [key]: arr } : i,
        ),
      };
    }),

  equalizeImpTravs: (id, axis, innerSize) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const key = axis === "h" ? "travH" : "travV";
      const existing = imp[key] || [];
      if (existing.length === 0) return s;
      const positions = equalizedPos(existing.length - 1, innerSize, 90);
      const sorted = [...existing].sort((a, b) => a.pos - b.pos);
      return {
        impostes: s.impostes.map((i) =>
          i.id === id
            ? {
                ...i,
                [key]: sorted.map((t, idx) => ({ ...t, pos: positions[idx] })),
              }
            : i,
        ),
      };
    }),

  setBothRowsH: (row0H, row1H) =>
    set((s) => ({
      impostes: s.impostes.map((i) => {
        if (i.row === 0)
          return { ...i, h: Math.max(100, Math.min(800, Math.round(row0H))) };
        if (i.row === 1)
          return { ...i, h: Math.max(100, Math.min(800, Math.round(row1H))) };
        return i;
      }),
    })),

  updateImpSubZone: (id, zoneKey, type) =>
    set((s) => ({
      impostes: s.impostes.map((i) =>
        i.id === id
          ? { ...i, subZones: { ...i.subZones, [zoneKey]: type } }
          : i,
      ),
    })),

  // Met à jour coveredIds d'une imposte ET retire les éléments pris aux voisines de même rangée
  // Si une voisine devient vide, elle est supprimée
  claimCoveredIds: (id, newCoveredIds) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const updated = s.impostes
        .map((i) => {
          if (i.id === id) {
            return {
              ...i,
              coveredIds: newCoveredIds,
              travV: [],
              subZones: buildSubZones((i.travH?.length || 0) + 1, 1),
            };
          }
          if (i.row === imp.row) {
            const filtered = i.coveredIds.filter(
              (cid) => !newCoveredIds.includes(cid),
            );
            if (filtered.length === i.coveredIds.length) return i; // rien changé
            if (filtered.length === 0) return null; // sera supprimée
            return {
              ...i,
              coveredIds: filtered,
              travV: [],
              subZones: buildSubZones((i.travH?.length || 0) + 1, 1),
            };
          }
          return i;
        })
        .filter(Boolean);
      return { impostes: updated };
    }),

  updateImposteCoveredIds: (id, coveredIds) =>
    set((s) => ({
      impostes: s.impostes.map((i) =>
        i.id === id
          ? {
              ...i,
              coveredIds,
              travV: [],
              subZones: buildSubZones((i.travH?.length || 0) + 1, 1),
            }
          : i,
      ),
    })),

  addImposteSegment: (row, coveredIds, h = 300) =>
    set((s) => {
      _impN++;
      return {
        impostes: [
          ...s.impostes,
          {
            id: `imp-${_impN}`,
            row,
            h,
            coveredIds,
            travH: [],
            travV: [],
            subZones: { "0_0": "vitrage" },
          },
        ],
      };
    }),

  alignImposteToEls: (id) =>
    set((s) => {
      const imp = s.impostes.find((i) => i.id === id);
      if (!imp) return s;
      const RX_VAL = 3500;
      const IM = 70;
      const BAR = 90;
      const ouvW = s.hasOuvrant ? s.W : 0;
      const positioned = computePositioned(s.elements, ouvW, RX_VAL);
      const covered = positioned.filter(
        (p) =>
          imp.coveredIds.includes(p.id) &&
          !(
            s.elements.find((e) => e.id === p.id)?.type === "ouvrant" &&
            !s.hasOuvrant
          ),
      );
      if (covered.length < 2) return s;
      const impX = Math.min(...covered.map((p) => p.x));
      const impEndX = Math.max(...covered.map((p) => p.x + p.w));
      const innerX = impX + IM;
      const innerW = impEndX - impX - 2 * IM;
      const sortedCovered = [...covered].sort((a, b) => a.x - b.x);
      _subTravN++;
      const newTravV = [];
      for (let i = 0; i < sortedCovered.length - 1; i++) {
        const el = sortedCovered[i];
        const pos = el.x + el.w - innerX - Math.floor(BAR / 2);
        if (pos > 10 && pos < innerW - BAR - 10)
          newTravV.push({ id: `ivt-al-${_subTravN}-${i}`, pos });
      }
      if (newTravV.length === 0) return s;
      const nRows = (imp.travH?.length || 0) + 1;
      return {
        impostes: s.impostes.map((i) =>
          i.id === id
            ? {
                ...i,
                travV: newTravV,
                subZones: buildSubZones(nRows, newTravV.length + 1),
              }
            : i,
        ),
      };
    }),

  // ── Éléments ──────────────────────────────────────
  addElement: (type, side = "right") =>
    set((s) => {
      if (type === "pt" && s.elements.some((e) => e.type === "pt")) return s;
      const id = `${type}-${Date.now()}`;
      const chassisN =
        s.elements.filter((e) => e.type === "chassis").length + 1;
      const label =
        type === "chassis"
          ? `Châssis ${chassisN}`
          : type === "elargisseur"
            ? "Élargisseur"
            : "Poteau Technique";
      const w = type === "chassis" ? 500 : type === "elargisseur" ? 100 : 280;
      const el = {
        id,
        type,
        label,
        w,
        h: type === "chassis" ? s.H : undefined,
        locked: false,
        fill: "vitrage",
        travH: [],
        travV: [],
        subZones: { "0_0": "vitrage" },
      };
      const ouvIdx = s.elements.findIndex((e) => e.type === "ouvrant");
      const arr = [...s.elements];
      if (side === "left") {
        arr.splice(0, 0, el);
      } else if (type === "pt") {
        arr.splice(ouvIdx + 1, 0, el);
      } else {
        arr.push(el);
      }
      // Ajouter le nouvel élément aux impostes "globales" (qui couvraient tous les éléments)
      const currentAllIds = s.elements.map((e) => e.id);
      const newImpostes = s.impostes.map((imp) => {
        const coversAll = currentAllIds.every((eid) =>
          imp.coveredIds.includes(eid),
        );
        if (coversAll) {
          return {
            ...imp,
            coveredIds: [...imp.coveredIds, id],
            travV: [],
            subZones: buildSubZones((imp.travH?.length || 0) + 1, 1),
          };
        }
        return imp;
      });
      return { elements: arr, selectedId: id, impostes: newImpostes };
    }),

  removeElement: (id) =>
    set((s) => {
      let newImpostes = s.impostes
        .map((imp) => ({
          ...imp,
          coveredIds: imp.coveredIds.filter((cid) => cid !== id),
        }))
        .filter((imp) => imp.coveredIds.length > 0);
      // Si plus d'impostes row=0, supprimer row=1
      if (!newImpostes.some((i) => i.row === 0)) {
        newImpostes = newImpostes.filter((i) => i.row !== 1);
      }
      return {
        elements: s.elements.filter((el) => el.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        impostes: newImpostes,
      };
    }),

  moveElement: (id, dir) =>
    set((s) => {
      const idx = s.elements.findIndex((el) => el.id === id);
      if (idx < 0) return s;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= s.elements.length) return s;
      if (s.elements[targetIdx].locked) {
        const arr = [...s.elements];
        const [moved] = arr.splice(idx, 1);
        const ouvNewIdx = arr.findIndex((el) => el.locked);
        arr.splice(dir === -1 ? ouvNewIdx : ouvNewIdx + 1, 0, moved);
        return { elements: arr };
      }
      const arr = [...s.elements];
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return { elements: arr };
    }),

  reorderElement: (id, insertBeforeId) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;
      const arr = s.elements.filter((e) => e.id !== id);
      if (insertBeforeId === null) {
        arr.push(el);
      } else {
        const idx = arr.findIndex((e) => e.id === insertBeforeId);
        arr.splice(idx < 0 ? arr.length : idx, 0, el);
      }
      return { elements: arr };
    }),

  updateElementW: (id, w) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;

      if (el.type === "elargisseur") {
        return {
          elements: s.elements.map((e) => (e.id === id ? { ...e, w } : e)),
        };
      }

      const nV = el.travV?.length || 0;
      const minW = 150 + nV * 100;
      const clampedW = Math.max(w, minW);

      const oldInnerW = el.w - 140;
      const newInnerW = clampedW - 140;
      const scaled =
        oldInnerW > 0 && el.travV?.length
          ? el.travV.map((t) => ({
              ...t,
              pos: Math.round((t.pos * newInnerW) / oldInnerW),
            }))
          : el.travV || [];

      const sorted = [...scaled].sort((a, b) => a.pos - b.pos);
      const zonesValid =
        sorted.length === 0 ||
        (sorted[0].pos >= 10 &&
          newInnerW - sorted[sorted.length - 1].pos - 90 >= 10 &&
          sorted.every((t, i) => i === 0 || t.pos - sorted[i - 1].pos >= 100));
      const eqPos = zonesValid
        ? null
        : equalizedPos(sorted.length - 1, newInnerW, 90);
      const scaledTravV = zonesValid
        ? scaled
        : sorted.map((t, i) => ({ ...t, pos: eqPos[i] }));

      const newElements = s.elements.map((e) =>
        e.id === id ? { ...e, w: clampedW, travV: scaledTravV } : e,
      );

      // Scale travV des impostes qui couvrent cet élément
      const scaledImpostes = s.impostes.map((imp) => {
        if (!imp.coveredIds.includes(id)) return imp;
        const oldW = calcImpW(imp, s.elements, s.hasOuvrant);
        const newW = calcImpW(imp, newElements, s.hasOuvrant);
        const oldIW = oldW - 140;
        const newIW = newW - 140;
        if (oldIW <= 0 || !imp.travV?.length) return imp;
        return {
          ...imp,
          travV: imp.travV.map((t) => ({
            ...t,
            pos: Math.round((t.pos * newIW) / oldIW),
          })),
        };
      });

      return { elements: newElements, impostes: scaledImpostes };
    }),

  updateElementH: (id, h) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id);
      if (!el) return s;
      const nH = el.travH?.length || 0;
      const clampedH = Math.max(h, 140 + nH * 100, 200);
      const oldInnerH = (el.h ?? s.H) - 140;
      const newInnerH = clampedH - 140;
      const scaled =
        oldInnerH > 0 && el.travH?.length
          ? el.travH.map((t) => ({
              ...t,
              pos: Math.round((t.pos * newInnerH) / oldInnerH),
            }))
          : el.travH || [];
      const sorted = [...scaled].sort((a, b) => a.pos - b.pos);
      const zonesValid =
        sorted.length === 0 ||
        (sorted[0].pos >= 10 &&
          newInnerH - sorted[sorted.length - 1].pos - 90 >= 10 &&
          sorted.every((t, i) => i === 0 || t.pos - sorted[i - 1].pos >= 100));
      const eqPos = zonesValid
        ? null
        : equalizedPos(sorted.length - 1, newInnerH, 90);
      const scaledTravH = zonesValid
        ? scaled
        : sorted.map((t, i) => ({ ...t, pos: eqPos[i] }));
      return {
        elements: s.elements.map((e) =>
          e.id === id ? { ...e, h: clampedH, travH: scaledTravH } : e,
        ),
      };
    }),

  updateElementFill: (id, fill) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, fill } : el)),
    })),
}));

export default useDoorStore;
