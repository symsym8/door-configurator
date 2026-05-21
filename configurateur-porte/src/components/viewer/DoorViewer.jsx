import { useMemo, useRef, useState, useEffect } from "react";
import useDoorStore from "../../store/useDoorStore";
import { RX, RY } from "../../constants/svgRef";
import Dormant from "./Dormant";
import Ouvrant from "./Ouvrant";
import Paumelles from "./Paumelles";
import Pivot, { PivotBas } from "./Pivot";
import Baton from "./Baton";
import Ventouse from "./Ventouse";
import Chassis from "./Chassis";
import PT from "./PT";
import Elargisseur from "./Elargisseur";
import ElargisseurH from "./ElargisseurH";
import Imposte from "./Imposte";
import FillSwitch from "./FillSwitch";
import "./DoorViewer.css";

const PADDING = 250;

function computeLayout(elements, W) {
  const ouvIdx = elements.findIndex((el) => el.type === "ouvrant");
  const result = new Array(elements.length);
  result[ouvIdx] = { ...elements[ouvIdx], x: RX };
  let leftX = RX;
  for (let i = ouvIdx - 1; i >= 0; i--) {
    leftX -= elements[i].w;
    result[i] = { ...elements[i], x: leftX };
  }
  let rightX = RX + W;
  for (let i = ouvIdx + 1; i < elements.length; i++) {
    result[i] = { ...elements[i], x: rightX };
    rightX += elements[i].w;
  }
  return result;
}

function clientToSVG(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

function computeInsertBefore(positioned, dragId, svgX) {
  const others = positioned.filter((p) => p.id !== dragId);
  for (const el of others) {
    if (svgX < el.x + el.w / 2) return el.id;
  }
  return null;
}

function calcImpBounds(imp, positioned, elements, hasOuvrant) {
  const covered = positioned.filter(
    (p) =>
      imp.coveredIds.includes(p.id) &&
      !(elements.find((e) => e.id === p.id)?.type === "ouvrant" && !hasOuvrant),
  );
  if (covered.length === 0) return null;
  const impX = Math.min(...covered.map((p) => p.x));
  const impEndX = Math.max(...covered.map((p) => p.x + p.w));
  if (impEndX <= impX) return null;
  return { impX, impW: impEndX - impX };
}

// Retourne les groupes d'éléments NON couverts sur une rangée donnée
function findUncoveredGroups(row, impostes, positioned, elements, hasOuvrant) {
  const coveredIds = new Set(
    impostes.filter((i) => i.row === row).flatMap((i) => i.coveredIds),
  );
  const visible = positioned
    .filter(
      (p) =>
        !(
          elements.find((e) => e.id === p.id)?.type === "ouvrant" && !hasOuvrant
        ),
    )
    .sort((a, b) => a.x - b.x);

  const groups = [];
  let cur = [];
  for (const p of visible) {
    if (!coveredIds.has(p.id)) {
      cur.push(p);
    } else if (cur.length > 0) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length > 0) groups.push(cur);
  return groups;
}

// Calcule les coveredIds après drag d'un bord — supporte rétrécissement ET extension
function calcNewCoveredIds(
  imp,
  edge,
  svgX,
  positioned,
  elements,
  hasOuvrant,
  allImpostes,
) {
  // Tous les éléments visibles triés par position
  const allVisible = positioned
    .filter(
      (p) =>
        !(
          elements.find((e) => e.id === p.id)?.type === "ouvrant" && !hasOuvrant
        ),
    )
    .sort((a, b) => a.x - b.x);

  if (allVisible.length === 0) return imp.coveredIds;

  const currentCovered = allVisible.filter((p) =>
    imp.coveredIds.includes(p.id),
  );
  if (currentCovered.length === 0) return imp.coveredIds;

  const leftmostCurrent = currentCovered[0];
  const rightmostCurrent = currentCovered[currentCovered.length - 1];
  const leftIdx = allVisible.indexOf(leftmostCurrent);
  const rightIdx = allVisible.indexOf(rightmostCurrent);

  if (edge === "right") {
    const newIds = [];
    for (let i = leftIdx; i < allVisible.length; i++) {
      const p = allVisible[i];
      if (p.x + p.w / 2 <= svgX) newIds.push(p.id);
      else break;
    }
    return newIds.length > 0 ? newIds : [leftmostCurrent.id];
  } else {
    const newIds = [];
    for (let i = rightIdx; i >= 0; i--) {
      const p = allVisible[i];
      if (p.x + p.w / 2 >= svgX) newIds.unshift(p.id);
      else break;
    }
    return newIds.length > 0 ? newIds : [rightmostCurrent.id];
  }
}

export default function DoorViewer() {
  const {
    W,
    H,
    ouv,
    ferrage,
    baton,
    fermeture,
    elements,
    selectedId,
    hasOuvrant,
    impostes,
    traversesH,
    zoneTypes,
    selectElement,
    reorderElement,
    updateZoneType,
    updateElementFill,
    updateChassisSubZone,
    updateImpSubZone,
    updateImposteCoveredIds,
    claimCoveredIds,
    addImposteSegment,
    ralColor,
    strokeColor,
    addElement,
    removeElement,
    toggleImposteRow,
    removeImposte,
    swapImposteRows,
    toggleOuvrant,
    setBothRowsH,
    elargisseursH,
    toggleElargisseurH,
    setElargisseurHPosition,
  } = useDoorStore();

  const svgRef = useRef(null);

  const [drag, setDrag] = useState(null);
  const [insertBefore, setInsertBefore] = useState(undefined);
  const [doorHovered, setDoorHovered] = useState(false);

  // Drag vertical impostes (swap rangées)
  const [dragImp, setDragImp] = useState(null);

  // Drag vertical élargisseur H (swap above/below)
  const [dragElhV, setDragElhV] = useState(null);

  // Drag horizontal bords imposte (split/resize)
  // { impId, edge: 'left'|'right', currentX: number }
  const [edgeDrag, setEdgeDrag] = useState(null);

  // Drag ligne de séparation entre rangées d'impostes
  // { totalH, startSvgY }
  const [dragRowBorder, setDragRowBorder] = useState(null);

  const layoutElements = useMemo(
    () =>
      hasOuvrant
        ? elements
        : elements.map((e) => (e.type === "ouvrant" ? { ...e, w: 0 } : e)),
    [elements, hasOuvrant],
  );
  const positioned = useMemo(
    () => computeLayout(layoutElements, hasOuvrant ? W : 0),
    [layoutElements, hasOuvrant, W],
  );

  const allDropZones = useMemo(() => {
    if (!drag) return [];
    const zones = positioned.map((el) => ({
      key: el.id,
      x: el.x,
      insertBefore: el.id,
    }));
    const last = positioned[positioned.length - 1];
    if (last)
      zones.push({ key: "__end__", x: last.x + last.w, insertBefore: null });
    return zones;
  }, [drag, positioned]);

  // Drag éléments horizontaux
  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      if (!svgRef.current) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const { x: svgX } = clientToSVG(svgRef.current, clientX, clientY);
      setDrag((d) => (d ? { ...d, svgX } : d));
      const ib = computeInsertBefore(positioned, drag.id, svgX);
      setInsertBefore(ib);
    };
    const onUp = () => {
      if (insertBefore !== undefined) reorderElement(drag.id, insertBefore);
      setDrag(null);
      setInsertBefore(undefined);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [drag, insertBefore, positioned, reorderElement]);

  const handleDragStart = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(id);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const { x: svgX } = clientToSVG(svgRef.current, clientX, clientY);
    setDrag({ id, svgX });
    setInsertBefore(undefined);
  };

  // Drag vertical impostes : swap rangées après 30px
  useEffect(() => {
    if (!dragImp) return;
    const imp = impostes.find((i) => i.id === dragImp.impId);
    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const delta = clientY - dragImp.startClientY;
      const shouldSwap =
        (imp?.row === 0 && delta < -30) || (imp?.row === 1 && delta > 30);
      if (shouldSwap) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onMove);
        swapImposteRows();
        setDragImp(null);
      }
    };
    const onUp = () => setDragImp(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragImp, impostes, swapImposteRows]);

  // Drag bord imposte : resize/split (mise à jour EN DIRECT à chaque déplacement)
  useEffect(() => {
    if (!edgeDrag) return;
    const onMove = (e) => {
      if (!svgRef.current) return;
      const { x: svgX } = clientToSVG(svgRef.current, e.clientX, e.clientY);
      setEdgeDrag((d) => (d ? { ...d, currentX: svgX } : d));
      // Applique le transfert en direct (les deux impostes bougent simultanément)
      const imp = impostes.find((i) => i.id === edgeDrag.impId);
      if (!imp) return;
      const newIds = calcNewCoveredIds(
        imp,
        edgeDrag.edge,
        svgX,
        positioned,
        elements,
        hasOuvrant,
        impostes,
      );
      if (newIds.join(",") !== imp.coveredIds.join(",")) {
        claimCoveredIds(imp.id, newIds);
      }
    };
    const onUp = () => setEdgeDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [edgeDrag, impostes, positioned, elements, hasOuvrant, claimCoveredIds]);

  // Drag ligne de séparation entre rangée 0 et rangée 1
  useEffect(() => {
    if (!dragRowBorder) return;
    const onMove = (e) => {
      if (!svgRef.current) return;
      const { y: svgY } = clientToSVG(svgRef.current, e.clientX, e.clientY);
      const newRow0H = Math.max(
        100,
        Math.min(dragRowBorder.totalH - 100, Math.round(RY - svgY)),
      );
      const newRow1H = dragRowBorder.totalH - newRow0H;
      setBothRowsH(newRow0H, newRow1H);
    };
    const onUp = () => setDragRowBorder(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragRowBorder, setBothRowsH]);

  // Drag vertical élargisseur H : swap above/below après 30px
  useEffect(() => {
    if (!dragElhV) return;
    const elh = elargisseursH.find((e) => e.id === dragElhV.elhId);
    if (!elh) return;
    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const delta = clientY - dragElhV.startClientY;
      const shouldSwap =
        (elh.position === "above" && delta > 30) ||
        (elh.position === "below" && delta < -30);
      if (shouldSwap) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onMove);
        setElargisseurHPosition(
          elh.id,
          elh.position === "above" ? "below" : "above",
        );
        setDragElhV(null);
      }
    };
    const onUp = () => setDragElhV(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragElhV, elargisseursH, setElargisseurHPosition]);

  const rawMinX = Math.min(...positioned.map((p) => p.x));
  const rawMaxX = Math.max(...positioned.map((p) => p.x + p.w));
  const floorY = RY + H;

  const row0 = impostes.filter((i) => i.row === 0);
  const row1 = impostes.filter((i) => i.row === 1);
  const maxH_row0 = row0.length ? Math.max(...row0.map((i) => i.h)) : 0;
  const maxH_row1 = row1.length ? Math.max(...row1.map((i) => i.h)) : 0;
  const elargHTotalH = elargisseursH.reduce((sum, e) => sum + e.h, 0);
  const elargBelowH = elargisseursH
    .filter((e) => e.position === "below")
    .reduce((sum, e) => sum + e.h, 0);
  const hasElargH = elargisseursH.length > 0;
  const extraH = maxH_row0 + maxH_row1 + elargHTotalH;
  const vbH = 2500 + PADDING * 2 + extraH;
  const vbY = floorY + PADDING - vbH;

  const chassisEls = positioned.filter((p) => p.type === "chassis");
  const ptEls = positioned.filter((p) => p.type === "pt");
  const elargisseurEls = positioned.filter((p) => p.type === "elargisseur");

  const ouvIdx = elements.findIndex((e) => e.type === "ouvrant");
  const leftCount = elements
    .slice(0, ouvIdx)
    .filter((e) => e.type === "chassis").length;
  const rightCount = elements
    .slice(ouvIdx + 1)
    .filter((e) => e.type === "chassis").length;

  const isEmptyViewer = !hasOuvrant && leftCount === 0 && rightCount === 0;
  const isStartScreen =
    isEmptyViewer && ptEls.length === 0 && impostes.length === 0;
  const emptyPad = isEmptyViewer ? (3 * (80 * 2 + 30)) / 2 + 80 : 0;
  const minX = rawMinX - emptyPad;
  const maxX = rawMaxX + emptyPad;
  const vbX = minX - PADDING;
  const vbW = maxX - minX + PADDING * 2;

  let _cn = 0;
  const dynLabels = {};
  elements.forEach((el) => {
    if (el.type === "chassis") dynLabels[el.id] = `Châssis ${++_cn}`;
    else if (el.type === "ouvrant") dynLabels[el.id] = "Ouvrant";
    else if (el.type === "pt") dynLabels[el.id] = "PT";
  });

  const pivotSide = baton === "d" ? "g" : "d";
  const paumellesSide = baton === "d" ? "g" : "d";

  const dW = W - 1000;
  const travInnerLeft =
    ferrage === "paumelles" ? 3645 : pivotSide === "g" ? 3660 : 3645;
  const travInnerWidth = ferrage === "paumelles" ? 710 + dW : 695 + dW;
  const innerTopSVG = 2145;
  const innerBottomSVG = RY + H - 110;

  const VITRAGE_COLOR = "#c8e8f8";
  const TOLE_COLOR = ralColor;
  const zoneFills = (() => {
    const fills = [];
    if (traversesH.length === 0) {
      fills.push({
        idx: 0,
        y: innerTopSVG,
        h: innerBottomSVG - innerTopSVG,
        type: zoneTypes[0] || "vitrage",
      });
    } else {
      fills.push({
        idx: 0,
        y: floorY - traversesH[0].y,
        h: Math.max(0, traversesH[0].y - 110),
        type: zoneTypes[0] || "vitrage",
      });
      for (let i = 0; i < traversesH.length - 1; i++) {
        fills.push({
          idx: i + 1,
          y: floorY - traversesH[i + 1].y,
          h: Math.max(0, traversesH[i + 1].y - traversesH[i].y - 90),
          type: zoneTypes[i + 1] || "vitrage",
        });
      }
      fills.push({
        idx: traversesH.length,
        y: innerTopSVG,
        h: Math.max(
          0,
          floorY - traversesH[traversesH.length - 1].y - 90 - innerTopSVG,
        ),
        type: zoneTypes[traversesH.length] || "vitrage",
      });
    }
    return fills;
  })();

  const zoneFillsEl = (
    <g id="zone-fills">
      {zoneFills.map((z, i) => (
        <g key={i}>
          <rect
            x={travInnerLeft}
            y={z.y}
            width={travInnerWidth}
            height={z.h}
            fill={z.type === "tole" ? TOLE_COLOR : VITRAGE_COLOR}
            stroke={strokeColor}
            strokeWidth="1"
          />
          {z.h >= 110 && (
            <FillSwitch
              cx={travInnerLeft + travInnerWidth / 2}
              cy={z.y + z.h / 2}
              type={z.type}
              onVitrage={() => updateZoneType(z.idx, "vitrage")}
              onTole={() => updateZoneType(z.idx, "tole")}
            />
          )}
        </g>
      ))}
    </g>
  );

  const travBarX = RX + 70;
  const travBarW = W - 140;
  const traversesBarEl = traversesH.length > 0 && (
    <g id="traverses-h">
      {traversesH.map((t) => (
        <rect
          key={t.id}
          x={travBarX}
          y={floorY - t.y - 90}
          width={travBarW}
          height={90}
          fill={ralColor}
        />
      ))}
    </g>
  );

  const ouvrantEl = (
    <>
      {hasOuvrant && ferrage === "pivot" && (
        <PivotBas W={W} H={H} side={pivotSide} />
      )}
      {hasOuvrant && <Dormant W={W} H={H} />}
      {hasOuvrant && fermeture === "ventouse" && (
        <Ventouse W={W} H={H} side={baton} />
      )}
      {hasOuvrant && <Ouvrant W={W} H={H} ferrage={ferrage} baton={baton} />}
      {hasOuvrant && zoneFillsEl}
      {hasOuvrant && traversesBarEl}
      {hasOuvrant &&
        (ferrage === "paumelles" ? (
          <Paumelles W={W} H={H} side={paumellesSide} />
        ) : (
          <Pivot W={W} H={H} side={pivotSide} />
        ))}
      {hasOuvrant && <Baton W={W} H={H} side={baton} />}
    </>
  );

  const ouvrantElInt = (
    <>
      {hasOuvrant && ferrage === "pivot" && (
        <PivotBas W={W} H={H} side={pivotSide} />
      )}
      {hasOuvrant && <Ouvrant W={W} H={H} ferrage={ferrage} baton={baton} />}
      {hasOuvrant && zoneFillsEl}
      {hasOuvrant && traversesBarEl}
      {hasOuvrant && <Baton W={W} H={H} side={baton} />}
      {hasOuvrant && <Dormant W={W} H={H} />}
      {hasOuvrant && ferrage === "pivot" && (
        <Pivot W={W} H={H} side={pivotSide} />
      )}
    </>
  );

  const renderChassis = (el) => {
    const fillType = el.fill || "vitrage";
    const hasSubTrav = (el.travH?.length || 0) + (el.travV?.length || 0) > 0;
    const elH = el.h ?? H;
    const yOff = H - elH;
    return (
      <g key={el.id} style={{ opacity: drag?.id === el.id ? 0.35 : 1 }}>
        <Chassis
          ox={el.x}
          ew={el.w}
          H={elH}
          yOff={yOff}
          fillType={fillType}
          travH={el.travH || []}
          travV={el.travV || []}
          subZones={el.subZones || {}}
          onUpdateSubZone={(zoneKey, type) =>
            updateChassisSubZone(el.id, zoneKey, type)
          }
          selected={selectedId === el.id}
          onSelect={(e) => {
            e.stopPropagation();
            selectElement(el.id);
          }}
          onDragStart={handleDragStart(el.id)}
        />
        {!hasSubTrav && (
          <FillSwitch
            cx={el.x + el.w / 2}
            cy={RY + yOff + elH / 2}
            type={fillType}
            onVitrage={() => updateElementFill(el.id, "vitrage")}
            onTole={() => updateElementFill(el.id, "tole")}
          />
        )}
      </g>
    );
  };

  const renderPT = (el) => (
    <PT
      key={el.id}
      ox={el.x}
      ew={el.w}
      H={H}
      selected={selectedId === el.id}
      onSelect={(e) => {
        e.stopPropagation();
        selectElement(el.id);
      }}
      onDragStart={handleDragStart(el.id)}
    />
  );

  const renderElargisseur = (el) => (
    <Elargisseur
      key={el.id}
      ox={el.x}
      ew={el.w}
      H={H}
      selected={selectedId === el.id}
      onSelect={() => selectElement(el.id)}
      onDragStart={handleDragStart(el.id)}
    />
  );

  const getImposteBaseY = (imp) =>
    imp.row === 0 ? RY - elargBelowH : RY - elargBelowH - maxH_row0;

  const getElhY = (elh) =>
    elh.position === "below"
      ? RY - elh.h
      : RY - elargBelowH - maxH_row0 - maxH_row1 - elh.h;

  const impLabels = (() => {
    const labels = [];
    row0.forEach((imp, idx) => {
      const bounds = calcImpBounds(imp, positioned, elements, hasOuvrant);
      if (!bounds) return;
      const baseY = getImposteBaseY(imp);
      const text =
        row0.length === 1 && row1.length === 0
          ? "Imposte"
          : `Imposte ${idx + 1}`;
      labels.push({
        id: imp.id,
        x: bounds.impX + bounds.impW / 2,
        y: baseY - imp.h - 30,
        text,
      });
    });
    row1.forEach((imp, idx) => {
      const bounds = calcImpBounds(imp, positioned, elements, hasOuvrant);
      if (!bounds) return;
      const baseY = getImposteBaseY(imp);
      const text = row1.length === 1 ? "Imposte 2" : `Imposte 2.${idx + 1}`;
      labels.push({
        id: imp.id,
        x: bounds.impX + bounds.impW / 2,
        y: baseY - imp.h - 30,
        text,
      });
    });
    return labels;
  })();

  const hasRow0 = row0.length > 0;
  const hasRow1 = row1.length > 0;
  const allImpX = positioned.length
    ? Math.min(...positioned.map((p) => p.x))
    : RX;
  const allImpEndX = positioned.length
    ? Math.max(...positioned.map((p) => p.x + p.w))
    : RX + W;

  // Preview bords pendant edgeDrag
  const edgePreview = edgeDrag
    ? (() => {
        const imp = impostes.find((i) => i.id === edgeDrag.impId);
        if (!imp) return null;
        const newIds = calcNewCoveredIds(
          imp,
          edgeDrag.edge,
          edgeDrag.currentX ?? 0,
          positioned,
          elements,
          hasOuvrant,
          impostes,
        );
        const newPos = positioned
          .filter((p) => newIds.includes(p.id))
          .filter(
            (p) =>
              !(
                elements.find((e) => e.id === p.id)?.type === "ouvrant" &&
                !hasOuvrant
              ),
          );
        if (newPos.length === 0) return null;
        const pX = Math.min(...newPos.map((p) => p.x));
        const pEndX = Math.max(...newPos.map((p) => p.x + p.w));
        const baseY = getImposteBaseY(imp);
        const splitLineX = edgeDrag.edge === "right" ? pEndX : pX;
        return { pX, pW: pEndX - pX, baseY, imp, splitLineX };
      })()
    : null;

  const renderImpostes = () =>
    impostes.map((imp) => {
      const bounds = calcImpBounds(imp, positioned, elements, hasOuvrant);
      if (!bounds) return null;
      const baseY = getImposteBaseY(imp);
      const isBeingEdgeDragged = edgeDrag?.impId === imp.id;
      return (
        <g
          key={imp.id}
          style={{
            opacity:
              dragImp?.impId === imp.id ? 0.35 : isBeingEdgeDragged ? 0.4 : 1,
          }}
        >
          <Imposte
            uid={imp.id}
            impX={bounds.impX}
            impW={bounds.impW}
            impH={imp.h}
            baseY={baseY}
            travH={imp.travH}
            travV={imp.travV}
            subZones={imp.subZones}
            onUpdateSubZone={(zoneKey, type) =>
              updateImpSubZone(imp.id, zoneKey, type)
            }
            selected={selectedId === imp.id}
            onSelect={(e) => {
              e.stopPropagation();
              selectElement(imp.id);
            }}
            onDragStart={(e) => {
              if (edgeDrag) return;
              e.preventDefault();
              e.stopPropagation();
              const clientY = e.touches ? e.touches[0].clientY : e.clientY;
              setDragImp({ impId: imp.id, startClientY: clientY });
            }}
          />
        </g>
      );
    });

  // Poignées de bord pour chaque imposte
  const renderEdgeHandles = () =>
    !drag &&
    !dragImp &&
    impostes.map((imp) => {
      const bounds = calcImpBounds(imp, positioned, elements, hasOuvrant);
      if (!bounds) return null;
      const baseY = getImposteBaseY(imp);
      const impY = baseY - imp.h;

      const HANDLE_W = 52;
      const HANDLE_H = Math.min(imp.h * 0.45, 240);
      const handleY = impY + (imp.h - HANDLE_H) / 2;
      const isActive = edgeDrag?.impId === imp.id;

      return (
        <g key={`eh-${imp.id}`}>
          {/* Poignée gauche */}
          <EdgeHandle
            cx={bounds.impX}
            cy={impY + imp.h / 2}
            w={HANDLE_W}
            h={HANDLE_H}
            active={isActive && edgeDrag.edge === "left"}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const { x: svgX } = clientToSVG(
                svgRef.current,
                e.clientX,
                e.clientY,
              );
              setEdgeDrag({ impId: imp.id, edge: "left", currentX: svgX });
            }}
          />
          {/* Poignée droite */}
          <EdgeHandle
            cx={bounds.impX + bounds.impW}
            cy={impY + imp.h / 2}
            w={HANDLE_W}
            h={HANDLE_H}
            active={isActive && edgeDrag.edge === "right"}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const { x: svgX } = clientToSVG(
                svgRef.current,
                e.clientX,
                e.clientY,
              );
              setEdgeDrag({ impId: imp.id, edge: "right", currentX: svgX });
            }}
          />
        </g>
      );
    });

  if (isStartScreen) {
    return (
      <div className="viewer-start">
        {[
          { label: "Châssis", onClick: () => addElement("chassis", "left") },
          { label: "Porte", onClick: toggleOuvrant },
        ].map((btn, i) => (
          <button key={i} className="start-btn" onClick={btn.onClick}>
            <span className="start-btn__plus">+</span>
            <span className="start-btn__label">{btn.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="viewer">
      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="viewer__svg"
        xmlns="http://www.w3.org/2000/svg"
        onClick={() => selectElement(null)}
        style={{
          touchAction: "none",
          cursor: edgeDrag
            ? "ew-resize"
            : dragRowBorder
              ? "ns-resize"
              : drag
                ? "grabbing"
                : "default",
        }}
      >
        {/* Sol */}
        <line
          x1={vbX}
          y1={floorY}
          x2={vbX + vbW}
          y2={floorY}
          stroke="#C4C1BB"
          strokeWidth="3"
        />

        {ouv === "ext" ? (
          <>
            {elargisseurEls.map(renderElargisseur)}
            {chassisEls.map(renderChassis)}
            {ptEls.map(renderPT)}
            <g
              cursor="grab"
              style={{
                opacity: drag?.id === "ouv" ? 0.35 : 1,
                filter:
                  selectedId === "ouv"
                    ? "drop-shadow(0 0 14px rgba(0,122,255,0.65))"
                    : doorHovered
                      ? "drop-shadow(0 6px 10px rgba(0,122,255,0.25))"
                      : "none",
                transition: "filter 0.15s ease",
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectElement("ouv");
              }}
              onMouseDown={handleDragStart("ouv")}
              onTouchStart={handleDragStart("ouv")}
              onMouseEnter={() => setDoorHovered(true)}
              onMouseLeave={() => setDoorHovered(false)}
            >
              <rect
                x={RX}
                y={RY}
                width={W}
                height={H}
                fill="transparent"
                stroke="none"
              />
              {ouvrantEl}
              {selectedId === "ouv" && (
                <rect
                  x={RX - 4}
                  y={RY - 4}
                  width={W + 8}
                  height={H + 8}
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="2.5"
                  rx="6"
                  opacity="0.7"
                  pointerEvents="none"
                />
              )}
            </g>
            {renderImpostes()}
            {elargisseursH.map((elh) => (
              <ElargisseurH
                key={elh.id}
                x={allImpX}
                y={getElhY(elh)}
                w={allImpEndX - allImpX}
                h={elh.h}
                selected={selectedId === elh.id}
                onSelect={() => selectElement(elh.id)}
                onDragStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectElement(elh.id);
                  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                  setDragElhV({ elhId: elh.id, startClientY: clientY });
                }}
              />
            ))}
          </>
        ) : (
          <>
            {elargisseurEls.map(renderElargisseur)}
            {chassisEls.map(renderChassis)}
            {ptEls.map(renderPT)}
            <g
              cursor="grab"
              style={{
                opacity: drag?.id === "ouv" ? 0.35 : 1,
                filter:
                  selectedId === "ouv"
                    ? "drop-shadow(0 0 14px rgba(0,122,255,0.65))"
                    : doorHovered
                      ? "drop-shadow(0 6px 10px rgba(0,122,255,0.25))"
                      : "none",
                transition: "filter 0.15s ease",
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectElement("ouv");
              }}
              onMouseDown={handleDragStart("ouv")}
              onTouchStart={handleDragStart("ouv")}
              onMouseEnter={() => setDoorHovered(true)}
              onMouseLeave={() => setDoorHovered(false)}
            >
              <rect
                x={RX}
                y={RY}
                width={W}
                height={H}
                fill="transparent"
                stroke="none"
              />
              {ouvrantElInt}
              {selectedId === "ouv" && (
                <rect
                  x={RX - 4}
                  y={RY - 4}
                  width={W + 8}
                  height={H + 8}
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="2.5"
                  rx="6"
                  opacity="0.7"
                  pointerEvents="none"
                />
              )}
            </g>
            {renderImpostes()}
            {elargisseursH.map((elh) => (
              <ElargisseurH
                key={elh.id}
                x={allImpX}
                y={getElhY(elh)}
                w={allImpEndX - allImpX}
                h={elh.h}
                selected={selectedId === elh.id}
                onSelect={() => selectElement(elh.id)}
                onDragStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectElement(elh.id);
                  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                  setDragElhV({ elhId: elh.id, startClientY: clientY });
                }}
              />
            ))}
          </>
        )}

        {/* Poignées de bord impostes */}
        {renderEdgeHandles()}

        {/* Poignée de séparation entre rangée 0 et rangée 1 */}
        {hasRow0 && hasRow1 && !drag && !edgeDrag && !dragImp && (
          <RowBorderHandle
            y={RY - maxH_row0}
            x1={allImpX}
            x2={allImpEndX}
            active={!!dragRowBorder}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragRowBorder({
                totalH: maxH_row0 + maxH_row1,
                startSvgY: RY - maxH_row0,
              });
            }}
          />
        )}

        {/* Boutons + au-dessus des éléments non couverts */}
        {!drag && !edgeDrag && !dragImp && (
          <>
            {hasRow0 &&
              findUncoveredGroups(
                0,
                impostes,
                positioned,
                elements,
                hasOuvrant,
              ).map((group, i) => {
                const gX = Math.min(...group.map((p) => p.x));
                const gEndX = Math.max(...group.map((p) => p.x + p.w));
                const avgH = row0.length
                  ? Math.round(
                      row0.reduce((s, im) => s + im.h, 0) / row0.length,
                    )
                  : 300;
                return (
                  <SmallPlusBtn
                    key={`uncov-0-${i}`}
                    cx={(gX + gEndX) / 2}
                    cy={RY - avgH / 2}
                    onClick={() =>
                      addImposteSegment(
                        0,
                        group.map((p) => p.id),
                        avgH,
                      )
                    }
                  />
                );
              })}
            {hasRow1 &&
              findUncoveredGroups(
                1,
                impostes,
                positioned,
                elements,
                hasOuvrant,
              ).map((group, i) => {
                const gX = Math.min(...group.map((p) => p.x));
                const gEndX = Math.max(...group.map((p) => p.x + p.w));
                const avgH = row1.length
                  ? Math.round(
                      row1.reduce((s, im) => s + im.h, 0) / row1.length,
                    )
                  : 300;
                return (
                  <SmallPlusBtn
                    key={`uncov-1-${i}`}
                    cx={(gX + gEndX) / 2}
                    cy={RY - maxH_row0 - avgH / 2}
                    onClick={() =>
                      addImposteSegment(
                        1,
                        group.map((p) => p.id),
                        avgH,
                      )
                    }
                  />
                );
              })}
          </>
        )}

        {/* Preview pendant edgeDrag */}
        {edgePreview && (
          <g pointerEvents="none">
            <rect
              x={edgePreview.pX}
              y={edgePreview.baseY - edgePreview.imp.h}
              width={edgePreview.pW}
              height={edgePreview.imp.h}
              fill="rgba(0,122,255,0.12)"
              stroke="#007AFF"
              strokeWidth="3"
              strokeDasharray="14,6"
              rx="4"
            />
            <line
              x1={edgePreview.splitLineX}
              y1={edgePreview.baseY - edgePreview.imp.h - 40}
              x2={edgePreview.splitLineX}
              y2={edgePreview.baseY + 40}
              stroke="#007AFF"
              strokeWidth="4"
              strokeDasharray="10,5"
            />
          </g>
        )}

        {/* Labels des éléments */}
        <g
          id="el-labels"
          pointerEvents="none"
          fontFamily="system-ui, sans-serif"
          fill="#333"
          textAnchor="middle"
        >
          {positioned
            .filter((el) => el.type !== "ouvrant" || hasOuvrant)
            .map((el) => (
              <text
                key={`lbl-${el.id}`}
                x={el.x + el.w / 2}
                y={floorY + 55}
                fontSize="52"
              >
                {dynLabels[el.id] || el.label}
              </text>
            ))}
          {impLabels.map((lbl) => (
            <text key={`lbl-imp-${lbl.id}`} x={lbl.x} y={lbl.y} fontSize="52">
              {lbl.text}
            </text>
          ))}
        </g>

        {/* Boutons + ajout éléments */}
        {!drag && !edgeDrag && (
          <>
            <AddButtons
              minX={minX}
              maxX={maxX}
              RX={RX}
              RY={RY}
              W={W}
              H={H}
              hasOuvrant={hasOuvrant}
              hasRow0={hasRow0}
              hasRow1={hasRow1}
              maxH_row0={maxH_row0}
              maxH_row1={maxH_row1}
              leftCount={leftCount}
              rightCount={rightCount}
              hasPT={elements.some((e) => e.type === "pt")}
              onAddLeft={() => addElement("chassis", "left")}
              onAddRight={() => addElement("chassis", "right")}
              onAddPT={() => addElement("pt")}
              onAddElargLeft={() => addElement("elargisseur", "left")}
              onAddElargRight={() => addElement("elargisseur", "right")}
              hasElargH={hasElargH}
              elargHTotalH={elargHTotalH}
              onAddElargH={toggleElargisseurH}
              onAddImposte={() => toggleImposteRow(0)}
              onAddImposte2={() => toggleImposteRow(1)}
              onAddOuvrant={toggleOuvrant}
            />
            <g id="minus-buttons">
              {hasOuvrant && (
                <MinusBtn
                  cx={RX + W / 2}
                  cy={RY + 35}
                  onClick={toggleOuvrant}
                />
              )}
              {positioned
                .filter((p) => !p.locked)
                .map((el) => (
                  <MinusBtn
                    key={`minus-${el.id}`}
                    cx={el.x + el.w / 2}
                    cy={RY + 35}
                    onClick={() => removeElement(el.id)}
                  />
                ))}
              {impostes.map((imp) => {
                const bounds = calcImpBounds(
                  imp,
                  positioned,
                  elements,
                  hasOuvrant,
                );
                if (!bounds) return null;
                const baseY = getImposteBaseY(imp);
                return (
                  <MinusBtn
                    key={`minus-imp-${imp.id}`}
                    cx={bounds.impX + bounds.impW / 2}
                    cy={baseY - imp.h + 35}
                    onClick={() => removeImposte(imp.id)}
                  />
                );
              })}
              {elargisseursH.map((elh) => (
                <MinusBtn
                  key={`minus-elh-${elh.id}`}
                  cx={(rawMinX + rawMaxX) / 2}
                  cy={getElhY(elh) + 35}
                  onClick={toggleElargisseurH}
                />
              ))}
            </g>
          </>
        )}

        {/* Indicateur swap pendant drag vertical imposte */}
        {dragImp &&
          hasRow0 &&
          hasRow1 &&
          (() => {
            const imp = impostes.find((i) => i.id === dragImp.impId);
            if (!imp) return null;
            const baseY = getImposteBaseY(imp);
            return (
              <g pointerEvents="none">
                <rect
                  x={allImpX - 30}
                  y={baseY - imp.h - 30}
                  width={allImpEndX - allImpX + 60}
                  height={60}
                  fill="rgba(0,122,255,0.12)"
                  rx="10"
                />
                <line
                  x1={allImpX - 30}
                  y1={baseY - imp.h}
                  x2={allImpEndX + 30}
                  y2={baseY - imp.h}
                  stroke="#007AFF"
                  strokeWidth="4"
                  strokeDasharray="12,6"
                />
              </g>
            );
          })()}

        {/* Zones de dépôt pendant drag élément */}
        {drag && (
          <g pointerEvents="none">
            {allDropZones.map((zone) => {
              const isActive = zone.insertBefore === insertBefore;
              return (
                <g key={zone.key}>
                  <rect
                    x={zone.x - 40}
                    y={RY - 30}
                    width={80}
                    height={H + 60}
                    fill={
                      isActive ? "rgba(0,122,255,0.18)" : "rgba(0,122,255,0.05)"
                    }
                    rx="12"
                  />
                  <line
                    x1={zone.x}
                    y1={RY - 30}
                    x2={zone.x}
                    y2={RY + H + 30}
                    stroke={isActive ? "#007AFF" : "rgba(0,122,255,0.25)"}
                    strokeWidth={isActive ? 5 : 2}
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <span className="viewer__dim-badge">
        {maxX - minX} × {H} mm
      </span>
    </div>
  );
}

// Petit bouton + pour ajouter une imposte sur des éléments non couverts
function SmallPlusBtn({ cx, cy, onClick }) {
  const R = 55;
  return (
    <g
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      opacity="0.72"
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.72")}
      style={{ transition: "opacity 0.15s" }}
    >
      <circle cx={cx} cy={cy + 4} r={R} fill="rgba(0,0,0,0.08)" />
      <circle cx={cx} cy={cy} r={R} fill="white" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="#007AFF"
        strokeWidth="3"
      />
      <rect
        x={cx - 22}
        y={cy - 5}
        width={44}
        height={10}
        rx={5}
        fill="#007AFF"
        pointerEvents="none"
      />
      <rect
        x={cx - 5}
        y={cy - 22}
        width={10}
        height={44}
        rx={5}
        fill="#007AFF"
        pointerEvents="none"
      />
    </g>
  );
}

// Poignée de séparation horizontale entre deux rangées d'impostes
function RowBorderHandle({ y, x1, x2, active, onMouseDown }) {
  const [hov, setHov] = useState(false);
  const show = hov || active;
  const midX = (x1 + x2) / 2;
  const PILL_W = 160;
  const PILL_H = 44;

  return (
    <g
      cursor="ns-resize"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ transition: "opacity 0.15s" }}
      opacity={show ? 1 : 0.45}
    >
      {/* Zone de clic élargie */}
      <rect x={x1} y={y - 35} width={x2 - x1} height={70} fill="transparent" />
      {/* Ligne tiretée */}
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke={active ? "#007AFF" : "rgba(0,122,255,0.65)"}
        strokeWidth={active ? 5 : 3}
        strokeDasharray="18,7"
        pointerEvents="none"
      />
      {/* Pilule centrale */}
      <rect
        x={midX - PILL_W / 2}
        y={y - PILL_H / 2}
        width={PILL_W}
        height={PILL_H}
        rx={PILL_H / 2}
        fill={active ? "#007AFF" : "rgba(0,122,255,0.75)"}
        stroke="white"
        strokeWidth="3"
        pointerEvents="none"
      />
      {/* Flèches haut/bas */}
      <path
        d={`M${midX} ${y - 14} L${midX - 12} ${y - 4} L${midX + 12} ${y - 4} Z`}
        fill="white"
        pointerEvents="none"
      />
      <path
        d={`M${midX} ${y + 14} L${midX - 12} ${y + 4} L${midX + 12} ${y + 4} Z`}
        fill="white"
        pointerEvents="none"
      />
    </g>
  );
}

// Poignée de bord d'imposte (gauche ou droite)
function EdgeHandle({ cx, cy, w, h, active, onMouseDown }) {
  const [hov, setHov] = useState(false);
  const show = hov || active;
  return (
    <g
      cursor="ew-resize"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      opacity={show ? 1 : 0.35}
      style={{ transition: "opacity 0.15s" }}
    >
      {/* Zone de clic élargie (invisible) */}
      <rect
        x={cx - w}
        y={cy - h / 2}
        width={w * 2}
        height={h}
        fill="transparent"
      />
      {/* Pilule visible */}
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={w / 2}
        fill={active ? "#007AFF" : "rgba(0,122,255,0.75)"}
        stroke="white"
        strokeWidth="3"
        pointerEvents="none"
      />
      {/* Lignes verticales internes */}
      <line
        x1={cx - 10}
        y1={cy - h * 0.22}
        x2={cx - 10}
        y2={cy + h * 0.22}
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        pointerEvents="none"
      />
      <line
        x1={cx + 10}
        y1={cy - h * 0.22}
        x2={cx + 10}
        y2={cy + h * 0.22}
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        pointerEvents="none"
      />
    </g>
  );
}

const BTN_R = 80;
const BTN_GAP = 190;
const BTN_V_GAP = 380;

function MinusBtn({ cx, cy, onClick }) {
  const R = 55;
  const ARM = 19;
  return (
    <g
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ transition: "opacity 0.15s" }}
      opacity="0.72"
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.72")}
    >
      <circle cx={cx} cy={cy + 5} r={R} fill="rgba(0,0,0,0.10)" />
      <circle cx={cx} cy={cy} r={R} fill="rgba(255,255,255,0.92)" />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(60,60,67,0.18)"
        strokeWidth="3"
      />
      <line
        x1={cx - ARM}
        y1={cy - ARM}
        x2={cx + ARM}
        y2={cy + ARM}
        stroke="#3a3a3c"
        strokeWidth="7"
        strokeLinecap="round"
        pointerEvents="none"
      />
      <line
        x1={cx + ARM}
        y1={cy - ARM}
        x2={cx - ARM}
        y2={cy + ARM}
        stroke="#3a3a3c"
        strokeWidth="7"
        strokeLinecap="round"
        pointerEvents="none"
      />
    </g>
  );
}

function PlusBtn({ cx, cy, label, onClick }) {
  return (
    <g
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ transition: "opacity 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
      opacity="0.75"
    >
      <circle cx={cx} cy={cy + 6} r={BTN_R} fill="rgba(0,0,0,0.10)" />
      <circle cx={cx} cy={cy} r={BTN_R} fill="#ffffff" />
      <circle
        cx={cx}
        cy={cy}
        r={BTN_R}
        fill="none"
        stroke="#007AFF"
        strokeWidth="4"
      />
      <rect
        x={cx - 32}
        y={cy - 7}
        width={64}
        height={14}
        rx={7}
        fill="#007AFF"
        pointerEvents="none"
      />
      <rect
        x={cx - 7}
        y={cy - 32}
        width={14}
        height={64}
        rx={7}
        fill="#007AFF"
        pointerEvents="none"
      />
      <text
        x={cx}
        y={cy + BTN_R + 58}
        textAnchor="middle"
        fontSize="40"
        fontWeight="600"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
        fill="#007AFF"
        pointerEvents="none"
        letterSpacing="1"
      >
        {label}
      </text>
    </g>
  );
}

function AddButtons({
  minX,
  maxX,
  RX,
  RY,
  W,
  H,
  hasOuvrant,
  hasRow0,
  hasRow1,
  maxH_row0,
  maxH_row1,
  leftCount,
  rightCount,
  hasPT,
  onAddLeft,
  onAddRight,
  onAddPT,
  onAddElargLeft,
  onAddElargRight,
  hasElargH,
  elargHTotalH,
  onAddElargH,
  onAddImposte,
  onAddImposte2,
  onAddOuvrant,
}) {
  const midY = RY + H / 2;
  const totalImpH = maxH_row0 + maxH_row1;
  const topY = RY - totalImpH - elargHTotalH - BTN_V_GAP;
  const midX = (minX + maxX) / 2;
  const S = BTN_R * 2 + 30; // espacement horizontal
  const SV = BTN_R * 2 + 90; // espacement vertical (inclut la hauteur du label)

  const porteShift = BTN_R * 2 + 30;
  const rightSpacer = !hasOuvrant && leftCount > 0 ? porteShift : 0;
  const leftSpacer = !hasOuvrant && rightCount > 0 ? porteShift : 0;
  const leftChassisX = minX - BTN_GAP - leftSpacer;
  const rightChassisX = maxX + BTN_GAP + rightSpacer;
  const ptX = maxX + BTN_GAP + BTN_R * 2 + 50 + rightSpacer;
  const elargLeftX = leftChassisX - BTN_R * 2 - 50;
  const elargRightX = hasPT
    ? rightChassisX + BTN_R * 2 + 50
    : ptX + BTN_R * 2 + 50;

  let porteCx = midX;
  if (!hasOuvrant) {
    if (leftCount > 0) porteCx = maxX + BTN_GAP;
    else if (rightCount > 0) porteCx = minX - BTN_GAP;
  }

  const isEmpty = !hasOuvrant && leftCount === 0 && rightCount === 0 && !hasPT;
  if (isEmpty) {
    const btns = [
      { label: "Châssis", onClick: onAddLeft },
      { label: "Porte", onClick: onAddOuvrant },
      { label: "Châssis", onClick: onAddRight },
      { label: "PT", onClick: onAddPT },
    ];
    const totalW = (btns.length - 1) * S;
    const startX = midX - totalW / 2;
    return (
      <g id="add-buttons" pointerEvents="all">
        {btns.map((b, i) => (
          <PlusBtn
            key={b.label + i}
            cx={startX + i * S}
            cy={midY}
            label={b.label}
            onClick={b.onClick}
          />
        ))}
        {(() => {
          const hasElements = hasOuvrant || leftCount > 0 || rightCount > 0;
          const topBtns = [];
          if (!hasElargH && hasElements)
            topBtns.push({ label: "Élarg.", onClick: onAddElargH });
          if (!hasRow0 && hasElements)
            topBtns.push({ label: "Imposte", onClick: onAddImposte });
          else if (hasRow0 && !hasRow1)
            topBtns.push({ label: "Imposte 2", onClick: onAddImposte2 });
          const topStartX = midX - ((topBtns.length - 1) * S) / 2;
          return topBtns.map((btn, i) => (
            <PlusBtn
              key={btn.label}
              cx={topStartX + i * S}
              cy={topY}
              label={btn.label}
              onClick={btn.onClick}
            />
          ));
        })()}
      </g>
    );
  }

  // Colonne gauche (verticale)
  const leftBtns = [];
  if (leftCount < 3) leftBtns.push({ label: "Châssis", onClick: onAddLeft });
  leftBtns.push({ label: "Élarg.", onClick: onAddElargLeft });
  const leftStartY = midY - ((leftBtns.length - 1) * SV) / 2;

  // Colonne droite (verticale) — Porte incluse si pas encore ajoutée
  const rightBtns = [];
  if (!hasOuvrant) rightBtns.push({ label: "Porte", onClick: onAddOuvrant });
  if (rightCount < 3) rightBtns.push({ label: "Châssis", onClick: onAddRight });
  if (!hasPT) rightBtns.push({ label: "PT", onClick: onAddPT });
  rightBtns.push({ label: "Élarg.", onClick: onAddElargRight });
  const rightStartY = midY - ((rightBtns.length - 1) * SV) / 2;

  // Boutons du haut (horizontaux)
  const hasElements = hasOuvrant || leftCount > 0 || rightCount > 0;
  const topBtns = [];
  if (!hasElargH && hasElements)
    topBtns.push({ label: "Élarg.", onClick: onAddElargH });
  if (!hasRow0 && hasElements)
    topBtns.push({ label: "Imposte", onClick: onAddImposte });
  else if (hasRow0 && !hasRow1)
    topBtns.push({ label: "Imposte 2", onClick: onAddImposte2 });
  const topStartX = midX - ((topBtns.length - 1) * S) / 2;

  return (
    <g id="add-buttons" pointerEvents="all">
      {leftBtns.map((btn, i) => (
        <PlusBtn
          key={`left-${btn.label}`}
          cx={leftChassisX}
          cy={leftStartY + i * SV}
          label={btn.label}
          onClick={btn.onClick}
        />
      ))}
      {rightBtns.map((btn, i) => (
        <PlusBtn
          key={`right-${btn.label}`}
          cx={rightChassisX}
          cy={rightStartY + i * SV}
          label={btn.label}
          onClick={btn.onClick}
        />
      ))}
      {topBtns.map((btn, i) => (
        <PlusBtn
          key={btn.label}
          cx={topStartX + i * S}
          cy={topY}
          label={btn.label}
          onClick={btn.onClick}
        />
      ))}
    </g>
  );
}
