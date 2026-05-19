import { useMemo, useRef, useState, useEffect } from "react";
import useDoorStore from "../../store/useDoorStore";
import { RX, RY } from "../../constants/svgRef";
import Dormant from "./Dormant";
import Ouvrant from "./Ouvrant";
import Paumelles from "./Paumelles";
import Pivot from "./Pivot";
import Baton from "./Baton";
import Ventouse from "./Ventouse";
import Chassis from "./Chassis";
import PT from "./PT";
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

// Convertit un point écran en coordonnées SVG
function clientToSVG(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

// Détermine devant quel élément on insère (null = à la fin)
function computeInsertBefore(positioned, dragId, svgX) {
  const others = positioned.filter((p) => p.id !== dragId);
  for (const el of others) {
    if (svgX < el.x + el.w / 2) return el.id;
  }
  return null;
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
    hasImposte,
    impH,
    traversesH,
    zoneTypes,
    impTravH,
    impTravV,
    impSubZones,
    hasImposte2,
    impH2,
    impTravH2,
    impTravV2,
    impSubZones2,
    selectElement,
    reorderElement,
    updateZoneType,
    updateElementFill,
    updateChassisSubZone,
    updateImposteSubZone,
    updateImposteSubZone2,
    ralColor,
    strokeColor,
    addElement,
    removeElement,
    toggleImposte,
    toggleImposte2,
    swapImpostes,
    toggleOuvrant,
  } = useDoorStore();

  const svgRef = useRef(null);

  // État du drag horizontal (éléments)
  const [drag, setDrag] = useState(null);
  const [insertBefore, setInsertBefore] = useState(undefined);
  const [doorHovered, setDoorHovered] = useState(false);

  // État du drag vertical (impostes) — { id: "imp1"|"imp2", startClientY: number } | null
  const [dragImp, setDragImp] = useState(null);

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

  // Toutes les zones de dépôt possibles pendant le drag
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

  // Handlers fenêtre (mousemove / mouseup) pendant le drag
  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      if (!svgRef.current) return;
      const { x: svgX } = clientToSVG(svgRef.current, e.clientX, e.clientY);
      setDrag((d) => (d ? { ...d, svgX } : d));
      const ib = computeInsertBefore(positioned, drag.id, svgX);
      setInsertBefore(ib);
    };

    const onUp = () => {
      if (insertBefore !== undefined) {
        reorderElement(drag.id, insertBefore);
      }
      setDrag(null);
      setInsertBefore(undefined);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, insertBefore, positioned, reorderElement]);

  const handleDragStart = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectElement(id);
    // eslint-disable-next-line react-hooks/refs
    const { x: svgX } = clientToSVG(svgRef.current, e.clientX, e.clientY);
    setDrag({ id, svgX });
    setInsertBefore(undefined);
  };

  // Drag vertical impostes : swap après 30px écran de glissement
  useEffect(() => {
    if (!dragImp) return;

    const onMove = (e) => {
      const delta = e.clientY - dragImp.startClientY;
      const shouldSwap =
        (dragImp.id === "imp1" && delta < -30) ||
        (dragImp.id === "imp2" && delta > 30);
      if (shouldSwap) {
        window.removeEventListener("mousemove", onMove);
        swapImpostes();
        setDragImp(null);
      }
    };

    const onUp = () => setDragImp(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragImp, swapImpostes]);

  const minX = Math.min(...positioned.map((p) => p.x));
  const maxX = Math.max(...positioned.map((p) => p.x + p.w));
  const vbX = minX - PADDING;
  const vbW = maxX - minX + PADDING * 2;
  const floorY = RY + H;
  // Hauteur fixe basée sur H max (2500) → le sol reste toujours à la même position
  const extraH = (hasImposte ? impH : 0) + (hasImposte2 ? impH2 : 0);
  const vbH = 2500 + PADDING * 2 + extraH;
  const vbY = floorY + PADDING - vbH;

  const impX = positioned.length ? Math.min(...positioned.map((p) => p.x)) : RX;
  const impEndX = positioned.length
    ? Math.max(...positioned.map((p) => p.x + p.w))
    : RX + W;

  const chassisEls = positioned.filter((p) => p.type === "chassis");
  const ptEls = positioned.filter((p) => p.type === "pt");

  // Compte les châssis par côté de l'ouvrant
  const ouvIdx = elements.findIndex((e) => e.type === "ouvrant");
  const leftCount = elements
    .slice(0, ouvIdx)
    .filter((e) => e.type === "chassis").length;
  const rightCount = elements
    .slice(ouvIdx + 1)
    .filter((e) => e.type === "chassis").length;

  // Numérotation dynamique des labels (même logique que ConfigPanel)
  let _cn = 0;
  const dynLabels = {};
  elements.forEach((el) => {
    if (el.type === "chassis") dynLabels[el.id] = `Châssis ${++_cn}`;
    else if (el.type === "ouvrant") dynLabels[el.id] = "Ouvrant";
    else if (el.type === "pt") dynLabels[el.id] = "PT";
  });

  const pivotSide = baton === "d" ? "g" : "d";
  const paumellesSide = baton === "d" ? "g" : "d";

  // Géométrie intérieure de l'ouvrant pour traverses + zones
  const dW = W - 1000;
  const travInnerLeft = ferrage === "paumelles" ? 3645 : 3660;
  const travInnerWidth = ferrage === "paumelles" ? 710 + dW : 695 + dW;
  const innerTopSVG = 2145; // y SVG du haut de la zone de remplissage (RY + 145)
  const innerBottomSVG = RY + H - 110; // y SVG du bas de la zone de remplissage

  // Zones de remplissage (vitrage / tôle)
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
      // Zone 0 — en bas, sous la première traverse
      fills.push({
        idx: 0,
        y: floorY - traversesH[0].y,
        h: Math.max(0, traversesH[0].y - 110),
        type: zoneTypes[0] || "vitrage",
      });
      // Zones intermédiaires
      for (let i = 0; i < traversesH.length - 1; i++) {
        fills.push({
          idx: i + 1,
          y: floorY - traversesH[i + 1].y,
          h: Math.max(0, traversesH[i + 1].y - traversesH[i].y - 90),
          type: zoneTypes[i + 1] || "vitrage",
        });
      }
      // Zone haute — au-dessus de la dernière traverse
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

  // Traverses — de l'intérieur gauche au droit du dormant pour couvrir cint sans déborder
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
    return (
      <g key={el.id} style={{ opacity: drag?.id === el.id ? 0.35 : 1 }}>
        <Chassis
          ox={el.x}
          ew={el.w}
          H={H}
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
            cy={RY + H / 2}
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

  return (
    <div className="viewer">
      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="viewer__svg"
        xmlns="http://www.w3.org/2000/svg"
        onClick={() => selectElement(null)}
        style={{ cursor: drag ? "grabbing" : "default" }}
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
              onMouseEnter={() => setDoorHovered(true)}
              onMouseLeave={() => setDoorHovered(false)}
            >
              {/* Hit-area sur toute la porte */}
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
            {hasImposte && (
              <g style={{ opacity: dragImp?.id === "imp1" ? 0.35 : 1 }}>
                <Imposte
                  uid="imp1"
                  impX={impX}
                  impW={impEndX - impX}
                  impH={impH}
                  travH={impTravH}
                  travV={impTravV}
                  subZones={impSubZones}
                  onUpdateSubZone={(zoneKey, type) =>
                    updateImposteSubZone(zoneKey, type)
                  }
                  selected={selectedId === "imp1"}
                  onSelect={(e) => {
                    e.stopPropagation();
                    selectElement("imp1");
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragImp({ id: "imp1", startClientY: e.clientY });
                  }}
                />
              </g>
            )}
            {hasImposte && hasImposte2 && (
              <g style={{ opacity: dragImp?.id === "imp2" ? 0.35 : 1 }}>
                <Imposte
                  uid="imp2"
                  impX={impX}
                  impW={impEndX - impX}
                  impH={impH2}
                  baseY={RY - impH}
                  travH={impTravH2}
                  travV={impTravV2}
                  subZones={impSubZones2}
                  onUpdateSubZone={(zoneKey, type) =>
                    updateImposteSubZone2(zoneKey, type)
                  }
                  selected={selectedId === "imp2"}
                  onSelect={(e) => {
                    e.stopPropagation();
                    selectElement("imp2");
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragImp({ id: "imp2", startClientY: e.clientY });
                  }}
                />
              </g>
            )}
          </>
        ) : (
          <>
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
            {hasImposte && (
              <g style={{ opacity: dragImp?.id === "imp1" ? 0.35 : 1 }}>
                <Imposte
                  uid="imp1"
                  impX={impX}
                  impW={impEndX - impX}
                  impH={impH}
                  travH={impTravH}
                  travV={impTravV}
                  subZones={impSubZones}
                  onUpdateSubZone={(zoneKey, type) =>
                    updateImposteSubZone(zoneKey, type)
                  }
                  selected={selectedId === "imp1"}
                  onSelect={(e) => {
                    e.stopPropagation();
                    selectElement("imp1");
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragImp({ id: "imp1", startClientY: e.clientY });
                  }}
                />
              </g>
            )}
            {hasImposte && hasImposte2 && (
              <g style={{ opacity: dragImp?.id === "imp2" ? 0.35 : 1 }}>
                <Imposte
                  uid="imp2"
                  impX={impX}
                  impW={impEndX - impX}
                  impH={impH2}
                  baseY={RY - impH}
                  travH={impTravH2}
                  travV={impTravV2}
                  subZones={impSubZones2}
                  onUpdateSubZone={(zoneKey, type) =>
                    updateImposteSubZone2(zoneKey, type)
                  }
                  selected={selectedId === "imp2"}
                  onSelect={(e) => {
                    e.stopPropagation();
                    selectElement("imp2");
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragImp({ id: "imp2", startClientY: e.clientY });
                  }}
                />
              </g>
            )}
          </>
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
          {hasImposte && (
            <text x={(impX + impEndX) / 2} y={RY - impH - 30} fontSize="52">
              {hasImposte2 ? "Imposte 1" : "Imposte"}
            </text>
          )}
          {hasImposte && hasImposte2 && (
            <text
              x={(impX + impEndX) / 2}
              y={RY - impH - impH2 - 30}
              fontSize="52"
            >
              Imposte 2
            </text>
          )}
        </g>

        {/* Boutons + ajout éléments */}
        {!drag && (
          <>
            <AddButtons
              minX={minX}
              maxX={maxX}
              RX={RX}
              RY={RY}
              W={W}
              H={H}
              hasOuvrant={hasOuvrant}
              hasImposte={hasImposte}
              hasImposte2={hasImposte2}
              impH={impH}
              impH2={impH2}
              leftCount={leftCount}
              rightCount={rightCount}
              hasPT={elements.some((e) => e.type === "pt")}
              onAddLeft={() => addElement("chassis", "left")}
              onAddRight={() => addElement("chassis", "right")}
              onAddPT={() => addElement("pt")}
              onAddImposte={() => toggleImposte()}
              onAddImposte2={() => toggleImposte2()}
              onAddOuvrant={toggleOuvrant}
            />
            {/* Boutons − suppression */}
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
              {hasImposte && (
                <MinusBtn
                  cx={(impX + impEndX) / 2}
                  cy={RY - impH + 35}
                  onClick={toggleImposte}
                />
              )}
              {hasImposte && hasImposte2 && (
                <MinusBtn
                  cx={(impX + impEndX) / 2}
                  cy={RY - impH - impH2 + 35}
                  onClick={toggleImposte2}
                />
              )}
            </g>
          </>
        )}

        {/* Indicateur de swap pendant le drag imposte */}
        {dragImp && hasImposte && hasImposte2 && (
          <g pointerEvents="none">
            <rect
              x={impX - 30}
              y={RY - impH - 30}
              width={impEndX - impX + 60}
              height={60}
              fill="rgba(0,122,255,0.12)"
              rx="10"
            />
            <line
              x1={impX - 30}
              y1={RY - impH}
              x2={impEndX + 30}
              y2={RY - impH}
              stroke="#007AFF"
              strokeWidth="4"
              strokeDasharray="12,6"
            />
          </g>
        )}

        {/* Zones de dépôt pendant le drag */}
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

const BTN_R = 80;
const BTN_GAP = 190; // écart horizontal (châssis gauche/droite)
const BTN_V_GAP = 380; // écart vertical (boutons imposte)

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
      {/* Ombre */}
      <circle cx={cx} cy={cy + 5} r={R} fill="rgba(0,0,0,0.10)" />
      {/* Fond blanc */}
      <circle cx={cx} cy={cy} r={R} fill="rgba(255,255,255,0.92)" />
      {/* Anneau subtil */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(60,60,67,0.18)"
        strokeWidth="3"
      />
      {/* × diagonal */}
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
      {/* Ombre portée */}
      <circle cx={cx} cy={cy + 6} r={BTN_R} fill="rgba(0,0,0,0.10)" />
      {/* Fond blanc */}
      <circle cx={cx} cy={cy} r={BTN_R} fill="#ffffff" />
      {/* Anneau bleu */}
      <circle
        cx={cx}
        cy={cy}
        r={BTN_R}
        fill="none"
        stroke="#007AFF"
        strokeWidth="4"
      />
      {/* Croix iOS : barre horizontale */}
      <rect
        x={cx - 32}
        y={cy - 7}
        width={64}
        height={14}
        rx={7}
        fill="#007AFF"
        pointerEvents="none"
      />
      {/* Croix iOS : barre verticale */}
      <rect
        x={cx - 7}
        y={cy - 32}
        width={14}
        height={64}
        rx={7}
        fill="#007AFF"
        pointerEvents="none"
      />
      {/* Label */}
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
  hasImposte,
  hasImposte2,
  impH,
  impH2,
  leftCount,
  rightCount,
  hasPT,
  onAddLeft,
  onAddRight,
  onAddPT,
  onAddImposte,
  onAddImposte2,
  onAddOuvrant,
}) {
  const midY = RY + H / 2;
  const totalImpH = (hasImposte ? impH : 0) + (hasImposte2 ? impH2 : 0);
  const topY = RY - totalImpH - BTN_V_GAP;
  const midX = (minX + maxX) / 2;
  const ptX = maxX + BTN_GAP + BTN_R * 2 + 50;
  const S = BTN_R * 2 + 30; // espacement centre-à-centre "côte à côte"

  // Viewer totalement vide (pas d'ouvrant, pas de châssis, pas de PT) → boutons groupés
  const isEmpty = !hasOuvrant && leftCount === 0 && rightCount === 0 && !hasPT;
  if (isEmpty) {
    const btns = [
      { label: "Châssis", onClick: onAddLeft },
      { label: "Porte", onClick: onAddOuvrant },
      { label: "Châssis", onClick: onAddRight },
      { label: "PT", onClick: onAddPT },
    ];
    const totalW = (btns.length - 1) * S;
    const startX = RX + W / 2 - totalW / 2;
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
        {!hasImposte && (
          <PlusBtn cx={midX} cy={topY} label="Imposte" onClick={onAddImposte} />
        )}
        {hasImposte && !hasImposte2 && (
          <PlusBtn
            cx={midX}
            cy={topY}
            label="Imposte 2"
            onClick={onAddImposte2}
          />
        )}
      </g>
    );
  }

  return (
    <g id="add-buttons" pointerEvents="all">
      {!hasOuvrant && (
        <PlusBtn
          cx={midX}
          cy={RY - BTN_V_GAP / 2}
          label="Porte"
          onClick={onAddOuvrant}
        />
      )}
      {leftCount < 3 && (
        <PlusBtn
          cx={minX - BTN_GAP}
          cy={midY}
          label="Châssis"
          onClick={onAddLeft}
        />
      )}
      {rightCount < 3 && (
        <PlusBtn
          cx={maxX + BTN_GAP}
          cy={midY}
          label="Châssis"
          onClick={onAddRight}
        />
      )}
      {!hasPT && <PlusBtn cx={ptX} cy={midY} label="PT" onClick={onAddPT} />}
      {!hasImposte && (
        <PlusBtn cx={midX} cy={topY} label="Imposte" onClick={onAddImposte} />
      )}
      {hasImposte && !hasImposte2 && (
        <PlusBtn
          cx={midX}
          cy={topY}
          label="Imposte 2"
          onClick={onAddImposte2}
        />
      )}
    </g>
  );
}
