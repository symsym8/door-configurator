import { RY } from "../../constants/svgRef";
import useDoorStore from "../../store/useDoorStore";
const SELECT_COLOR = "#3B7DD8";

export default function PT({ ox, ew, H, selected, onSelect, onDragStart }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const iph = {
    x: ox + (ew - 145) / 2,
    y: RY + H - 900 - 398,
    w: 145,
    h: 398,
  };

  return (
    <g
      id={`pt-${ox}`}
      cursor="grab"
      onClick={onSelect}
      onMouseDown={onDragStart}
    >
      <rect x={ox} y={RY} width={ew} height={H} fill={ralColor} />
      <rect
        x={ox + 0.5}
        y={RY + 0.5}
        width={ew - 1}
        height={H - 1}
        fill="none"
        stroke={selected ? SELECT_COLOR : strokeColor}
        strokeWidth={selected ? 2.5 : 1}
      />
      <rect
        x={iph.x}
        y={iph.y}
        width={iph.w}
        height={iph.h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        strokeDasharray="4,2"
      />
      {selected && (
        <rect
          x={ox - 4}
          y={RY - 4}
          width={ew + 8}
          height={H + 8}
          fill="none"
          stroke={SELECT_COLOR}
          strokeWidth="2"
          strokeDasharray="10,5"
          pointerEvents="none"
        />
      )}
    </g>
  );
}
