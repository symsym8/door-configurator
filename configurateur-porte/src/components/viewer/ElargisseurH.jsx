import { useState } from "react";
import useDoorStore from "../../store/useDoorStore";

const ACCENT = "#007AFF";

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

export default function ElargisseurH({
  x,
  y,
  w,
  h,
  selected,
  onSelect,
  onDragStart,
}) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const [hovered, setHovered] = useState(false);

  return (
    <g
      style={glowStyle(selected, hovered)}
      cursor="grab"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={ralColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
      {selected && (
        <rect
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2"
          strokeDasharray="6 3"
          rx="2"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
