import { useState } from "react";
import { RY } from "../../constants/svgRef";
import FillSwitch from "./FillSwitch";
import useDoorStore from "../../store/useDoorStore";

const CM = 70;
const CT = 70;
const BAR = 90;
const VITRAGE_COLOR = "#c8e8f8";
const ACCENT = "#007AFF";

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

function glowStyle(selected, hovered) {
  if (selected)
    return {
      filter: "drop-shadow(0 0 14px rgba(0,122,255,0.65))",
      transition: "filter 0.15s ease",
    };
  if (hovered)
    return {
      filter: "drop-shadow(0 6px 10px rgba(0,122,255,0.28))",
      transition: "filter 0.15s ease",
    };
  return { filter: "none", transition: "filter 0.15s ease" };
}

export default function Chassis({
  ox,
  ew,
  H,
  fillType,
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

  const innerX = ox + CM;
  const innerY = RY + CT;
  const innerW = ew - 2 * CM;
  const innerH = H - 2 * CT;

  const rowSegs = buildSegments(travH, innerH);
  const colSegs = buildSegments(travV, innerW);
  const noTrav = travH.length === 0 && travV.length === 0;

  return (
    <g
      id={`chassis-${ox}`}
      cursor="grab"
      style={glowStyle(selected, hovered)}
      onClick={onSelect}
      onMouseDown={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rect invisible = hit-area couvrant tout le châssis */}
      <rect
        x={ox}
        y={RY}
        width={ew}
        height={H}
        fill="transparent"
        stroke="none"
      />

      {/* 1 — Zone fills */}
      {rowSegs.map((rs, r) =>
        colSegs.map((cs, c) => {
          const zoneKey = `${r}_${c}`;
          const zType = noTrav ? fillType : (subZones[zoneKey] ?? fillType);
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
              {cs.size >= 60 && rs.size >= 60 && onUpdateSubZone && !noTrav && (
                <FillSwitch
                  cx={innerX + cs.start + cs.size / 2}
                  cy={innerY + rs.start + rs.size / 2}
                  type={zType}
                  scale={Math.min(1, cs.size / 170, rs.size / 110)}
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
          x={ox}
          y={innerY + t.pos}
          width={ew}
          height={BAR}
          fill={ralColor}
        />
      ))}

      {/* 3 — Traverses V */}
      {travV.map((t) => (
        <rect
          key={t.id}
          x={innerX + t.pos}
          y={RY}
          width={BAR}
          height={H}
          fill={ralColor}
        />
      ))}

      {/* 4 — Profils extérieurs */}
      <rect x={ox} y={RY} width={CM} height={H} fill={ralColor} />
      <rect x={ox + ew - CM} y={RY} width={CM} height={H} fill={ralColor} />
      <rect x={ox} y={RY} width={ew} height={CT} fill={ralColor} />
      <rect x={ox} y={RY + H - CT} width={ew} height={CT} fill={ralColor} />

      {/* 5 — Contour */}
      <rect
        x={ox + 0.5}
        y={RY + 0.5}
        width={ew - 1}
        height={H - 1}
        fill="none"
        stroke={selected ? ACCENT : strokeColor}
        strokeWidth={selected ? 2.5 : 1}
      />

      {/* Halo de sélection */}
      {selected && (
        <rect
          x={ox - 4}
          y={RY - 4}
          width={ew + 8}
          height={H + 8}
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
