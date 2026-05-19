import { create } from "zustand";

let _travN = 0;
let _subTravN = 0;

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

const useDoorStore = create((set) => ({
  W: 1000,
  H: 2100,
  ouv: "ext",
  ferrage: "paumelles",
  baton: "d",
  fermeture: "ventouse",
  elements: [
    { id: "ouv", type: "ouvrant", label: "Ouvrant", w: 1000, locked: true },
  ],
  selectedId: null,
  hasOuvrant: false,
  hasImposte: false,
  impH: 300,
  traversesH: [],
  zoneTypes: ["vitrage"],
  impTravH: [],
  impTravV: [],
  impSubZones: { "0_0": "vitrage" },
  hasImposte2: false,
  impH2: 300,
  impTravH2: [],
  impTravV2: [],
  impSubZones2: { "0_0": "vitrage" },
  ralColor: "#373f43",
  strokeColor: "#ffffff",

  setW: (W) =>
    set((s) => {
      const oldImpW = s.elements.reduce((sum, e) => sum + e.w, 0);
      const newImpW = oldImpW - s.W + W;
      const oldImpInnerW = oldImpW - 140;
      const newImpInnerW = newImpW - 140;
      const scaleV = (travV) =>
        oldImpInnerW > 0 && travV?.length
          ? travV.map((t) => ({
              ...t,
              pos: Math.round((t.pos * newImpInnerW) / oldImpInnerW),
            }))
          : travV;
      return {
        W,
        elements: s.elements.map((el) =>
          el.type === "ouvrant" ? { ...el, w: W } : el,
        ),
        impTravV: scaleV(s.impTravV),
        impTravV2: scaleV(s.impTravV2),
      };
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
  setImpH: (impH) => set({ impH }),
  toggleImposte: () =>
    set((s) => {
      if (!s.hasImposte) return { hasImposte: true };
      // Si imposte 2 existe, elle prend la place de imposte 1
      if (s.hasImposte2) {
        return {
          impH: s.impH2,
          impTravH: s.impTravH2,
          impTravV: s.impTravV2,
          impSubZones: s.impSubZones2,
          hasImposte2: false,
          impH2: 300,
          impTravH2: [],
          impTravV2: [],
          impSubZones2: { "0_0": "vitrage" },
        };
      }
      return { hasImposte: false };
    }),
  selectElement: (id) => set({ selectedId: id }),
  toggleOuvrant: () => set((s) => ({ hasOuvrant: !s.hasOuvrant })),

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
      const innerH = s.H - 140;
      const N = (el.travH?.length || 0) + 1;
      if (innerH < N * 90 + (N + 1) * 10) return s;
      const existing = el.travH || [];
      const positions = equalizedPos(existing.length, innerH, 90);
      _subTravN++;
      const newTravH = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `cht-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = newTravH.length + 1;
      const nCols = (el.travV?.length || 0) + 1;
      const subZones = buildSubZones(nRows, nCols, el.fill || "vitrage");
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
      const existing = el.travV || [];
      const positions = equalizedPos(existing.length, innerW, 90);
      _subTravN++;
      const newTravV = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `cvt-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = (el.travH?.length || 0) + 1;
      const nCols = newTravV.length + 1;
      const subZones = buildSubZones(nRows, nCols, el.fill || "vitrage");
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
      const newTrav = (el[key] || []).filter((t) => t.id !== travId);
      const travH = axis === "h" ? newTrav : el.travH || [];
      const travV = axis === "v" ? newTrav : el.travV || [];
      const subZones = buildSubZones(
        travH.length + 1,
        travV.length + 1,
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
      const innerSize = axis === "h" ? s.H - 140 : el.w - 140;
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

  // ── Traverses imposte ─────────────────────────────
  addImposteTraverseH: () =>
    set((s) => {
      if ((s.impTravH?.length || 0) >= 3) return s;
      const innerH = s.impH - 140;
      const existing = s.impTravH || [];
      const positions = equalizedPos(existing.length, innerH, 90);
      _subTravN++;
      const newTravH = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `iht-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = newTravH.length + 1;
      const nCols = (s.impTravV?.length || 0) + 1;
      return {
        impTravH: newTravH,
        impSubZones: buildSubZones(nRows, nCols),
      };
    }),

  addImposteTraverseV: (impW) =>
    set((s) => {
      if ((s.impTravV?.length || 0) >= 3) return s;
      const innerW = impW - 140;
      const existing = s.impTravV || [];
      const positions = equalizedPos(existing.length, innerW, 90);
      _subTravN++;
      const newTravV = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `ivt-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = (s.impTravH?.length || 0) + 1;
      const nCols = newTravV.length + 1;
      return {
        impTravV: newTravV,
        impSubZones: buildSubZones(nRows, nCols),
      };
    }),

  removeImposteTraverse: (axis, travId) =>
    set((s) => {
      const key = axis === "h" ? "impTravH" : "impTravV";
      const newTrav = (s[key] || []).filter((t) => t.id !== travId);
      const travH = axis === "h" ? newTrav : s.impTravH || [];
      const travV = axis === "v" ? newTrav : s.impTravV || [];
      return {
        [key]: newTrav,
        impSubZones: buildSubZones(travH.length + 1, travV.length + 1),
      };
    }),

  updateImposteTraverse: (axis, travId, pos) =>
    set((s) => {
      const key = axis === "h" ? "impTravH" : "impTravV";
      const others = (s[key] || []).filter((t) => t.id !== travId);
      if (others.some((t) => Math.abs(t.pos - pos) < 100)) return s;
      const arr = (s[key] || [])
        .map((t) => (t.id === travId ? { ...t, pos } : t))
        .sort((a, b) => a.pos - b.pos);
      return { [key]: arr };
    }),

  equalizeImposteTraverses: (axis, innerSize) =>
    set((s) => {
      const key = axis === "h" ? "impTravH" : "impTravV";
      const existing = s[key] || [];
      if (existing.length === 0) return s;
      const positions = equalizedPos(existing.length - 1, innerSize, 90);
      const sorted = [...existing].sort((a, b) => a.pos - b.pos);
      return { [key]: sorted.map((t, i) => ({ ...t, pos: positions[i] })) };
    }),

  updateImposteSubZone: (zoneKey, type) =>
    set((s) => ({
      impSubZones: { ...s.impSubZones, [zoneKey]: type },
    })),

  // ── Imposte 2 ─────────────────────────────────────
  toggleImposte2: () =>
    set((s) => ({
      hasImposte2: s.hasImposte ? !s.hasImposte2 : s.hasImposte2,
    })),

  swapImpostes: () =>
    set((s) => ({
      impH: s.impH2,
      impTravH: s.impTravH2,
      impTravV: s.impTravV2,
      impSubZones: s.impSubZones2,
      impH2: s.impH,
      impTravH2: s.impTravH,
      impTravV2: s.impTravV,
      impSubZones2: s.impSubZones,
    })),
  setImpH2: (impH2) => set({ impH2 }),

  addImposteTraverseH2: () =>
    set((s) => {
      if ((s.impTravH2?.length || 0) >= 3) return s;
      const innerH = s.impH2 - 140;
      const existing = s.impTravH2 || [];
      const positions = equalizedPos(existing.length, innerH, 90);
      _subTravN++;
      const newTravH = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `iht2-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = newTravH.length + 1;
      const nCols = (s.impTravV2?.length || 0) + 1;
      return { impTravH2: newTravH, impSubZones2: buildSubZones(nRows, nCols) };
    }),

  addImposteTraverseV2: (impW) =>
    set((s) => {
      if ((s.impTravV2?.length || 0) >= 3) return s;
      const innerW = impW - 140;
      const existing = s.impTravV2 || [];
      const positions = equalizedPos(existing.length, innerW, 90);
      _subTravN++;
      const newTravV = [
        ...existing.map((t, i) => ({ ...t, pos: positions[i] })),
        { id: `ivt2-${_subTravN}`, pos: positions[existing.length] },
      ].sort((a, b) => a.pos - b.pos);
      const nRows = (s.impTravH2?.length || 0) + 1;
      const nCols = newTravV.length + 1;
      return { impTravV2: newTravV, impSubZones2: buildSubZones(nRows, nCols) };
    }),

  removeImposteTraverse2: (axis, travId) =>
    set((s) => {
      const key = axis === "h" ? "impTravH2" : "impTravV2";
      const newTrav = (s[key] || []).filter((t) => t.id !== travId);
      const travH = axis === "h" ? newTrav : s.impTravH2 || [];
      const travV = axis === "v" ? newTrav : s.impTravV2 || [];
      return {
        [key]: newTrav,
        impSubZones2: buildSubZones(travH.length + 1, travV.length + 1),
      };
    }),

  updateImposteTraverse2: (axis, travId, pos) =>
    set((s) => {
      const key = axis === "h" ? "impTravH2" : "impTravV2";
      const others = (s[key] || []).filter((t) => t.id !== travId);
      if (others.some((t) => Math.abs(t.pos - pos) < 100)) return s;
      const arr = (s[key] || [])
        .map((t) => (t.id === travId ? { ...t, pos } : t))
        .sort((a, b) => a.pos - b.pos);
      return { [key]: arr };
    }),

  equalizeImposteTraverses2: (axis, innerSize) =>
    set((s) => {
      const key = axis === "h" ? "impTravH2" : "impTravV2";
      const existing = s[key] || [];
      if (existing.length === 0) return s;
      const positions = equalizedPos(existing.length - 1, innerSize, 90);
      const sorted = [...existing].sort((a, b) => a.pos - b.pos);
      return { [key]: sorted.map((t, i) => ({ ...t, pos: positions[i] })) };
    }),

  updateImposteSubZone2: (zoneKey, type) =>
    set((s) => ({
      impSubZones2: { ...s.impSubZones2, [zoneKey]: type },
    })),

  // ── Éléments ──────────────────────────────────────
  addElement: (type, side = "right") =>
    set((s) => {
      if (type === "pt" && s.elements.some((e) => e.type === "pt")) return s;
      const id = `${type}-${Date.now()}`;
      const chassisN =
        s.elements.filter((e) => e.type === "chassis").length + 1;
      const label =
        type === "chassis" ? `Châssis ${chassisN}` : "Poteau Technique";
      const w = type === "chassis" ? 500 : 280;
      const el = {
        id,
        type,
        label,
        w,
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
      return { elements: arr, selectedId: id };
    }),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

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

      const nV = el.travV?.length || 0;
      const minW = 150 + nV * 100;
      const clampedW = Math.max(w, minW);

      // Scale travV du châssis proportionnellement puis re-equalise si zones invalides
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

      // Scale impTravV de l'imposte proportionnellement
      const oldImpW = s.elements.reduce((sum, e) => sum + e.w, 0);
      const newImpW = oldImpW - el.w + w;
      const oldImpInnerW = oldImpW - 140;
      const newImpInnerW = newImpW - 140;
      const scaleImpV = (travV) =>
        oldImpInnerW > 0 && travV?.length
          ? travV.map((t) => ({
              ...t,
              pos: Math.round((t.pos * newImpInnerW) / oldImpInnerW),
            }))
          : travV;

      return {
        elements: s.elements.map((e) =>
          e.id === id ? { ...e, w: clampedW, travV: scaledTravV } : e,
        ),
        impTravV: scaleImpV(s.impTravV),
        impTravV2: scaleImpV(s.impTravV2),
      };
    }),

  updateElementFill: (id, fill) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, fill } : el)),
    })),
}));

export default useDoorStore;
