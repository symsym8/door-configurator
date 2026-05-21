import { useState } from "react";
import { RY } from "../../constants/svgRef";
import FillSwitch from "./FillSwitch";
import useDoorStore from "../../store/useDoorStore";

const IM = 70;
const BAR = 90;
const VITRAGE_COLOR = "#c8e8f8";

function buildSegments(traverses, innerSize) {
  const sorted = [...traverses].sort((a, b) => a.pos - b.pos);
  const segs = [];
  let cursor = 0;
  for (const t of sorted) {
    segs.push({ start: cursor, size: Math.max(0, t.pos - cursor) });
    cursor = t.pos + BAR;
  }
  segs.push({ start: cursor, size: Math.max(0, innerSize - cursor) });
  return segs;
}

const ACCENT = "#007AFF";

function glowStyle(selected, hovered) {
  if (selected)
    return {
      filter: "drop-shadow(0 0 14px rgba(0,122,255,0.65))",
      transition: "filter 0.15s ease",
    };
  if (hovered)
    return {
      filter: "drop-shadow(0 0 10px rgba(0,122,255,0.28))",
      transition: "filter 0.15s ease",
    };
  return { filter: "none", transition: "filter 0.15s ease" };
}

export default function Imposte({
  uid = "imp",
  impX,
  impW,
  impH,
  baseY,
  travH = [],
  travV = [],
  subZones = {},
  onUpdateSubZone,
  selected,
  onSelect,
  onDragStart,
}) {
  const [hovered, setHovered] = useState(false);
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);

  const impY = (baseY ?? RY) - impH;
  const innerX = impX + IM;
  const innerY = impY + IM;
  const innerW = impW - 2 * IM;
  const innerH = impH - 2 * IM;

  const rowSegs = buildSegments(travH, innerH);
  const colSegs = buildSegments(travV, innerW);

  return (
    <g
      id={`imposte-${uid}`}
      style={glowStyle(selected, hovered)}
      cursor="grab"
      onClick={onSelect}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hit-area couvrant toute l'imposte */}
      <rect
        x={impX}
        y={impY}
        width={impW}
        height={impH}
        fill="transparent"
        stroke="none"
      />

      {/* 1 — Zone fills */}
      {rowSegs.map((rs, r) =>
        colSegs.map((cs, c) => {
          const zoneKey = `${r}_${c}`;
          const zType = subZones[zoneKey] ?? "vitrage";
          return (
            <g key={zoneKey}>
              <rect
                x={innerX + cs.start}
                y={innerY + rs.start}
                width={cs.size}
                height={rs.size}
                fill={zType === "tole" ? ralColor : VITRAGE_COLOR}
                stroke={strokeColor}
                strokeWidth="1"
              />
              {cs.size >= 150 && rs.size >= 100 && onUpdateSubZone && (
                <FillSwitch
                  cx={innerX + cs.start + cs.size / 2}
                  cy={innerY + rs.start + rs.size / 2}
                  type={zType}
                  onVitrage={() => onUpdateSubZone(zoneKey, "vitrage")}
                  onTole={() => onUpdateSubZone(zoneKey, "tole")}
                />
              )}
            </g>
          );
        }),
      )}

      {/* 2 — Traverses H */}
      {travH.map((t) => (
        <rect
          key={t.id}
          x={impX}
          y={innerY + t.pos}
          width={impW}
          height={BAR}
          fill={ralColor}
        />
      ))}

      {/* 3 — Traverses V */}
      {travV.map((t) => (
        <rect
          key={t.id}
          x={innerX + t.pos}
          y={impY}
          width={BAR}
          height={impH}
          fill={ralColor}
        />
      ))}

      {/* 4 — Profils extérieurs */}
      <rect x={impX} y={impY} width={IM} height={impH} fill={ralColor} />
      <rect
        x={impX + impW - IM}
        y={impY}
        width={IM}
        height={impH}
        fill={ralColor}
      />
      <rect x={impX} y={impY} width={impW} height={IM} fill={ralColor} />
      <rect
        x={impX}
        y={impY + impH - IM}
        width={impW}
        height={IM}
        fill={ralColor}
      />

      {/* 5 — Contour extérieur */}
      <rect
        x={impX + 0.5}
        y={impY + 0.5}
        width={impW - 1}
        height={impH - 1}
        fill="none"
        stroke={selected ? ACCENT : strokeColor}
        strokeWidth={selected ? 2.5 : 1}
      />

      {/* Halo de sélection */}
      {selected && (
        <rect
          x={impX - 4}
          y={impY - 4}
          width={impW + 8}
          height={impH + 8}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
          rx="6"
          opacity="0.7"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
