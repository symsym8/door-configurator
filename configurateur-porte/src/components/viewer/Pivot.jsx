import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import useDoorStore from "../../store/useDoorStore";

export default function Pivot({ W, H, side }) {
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const key = side === "g" ? "pivot_g" : "pivot_d";
  const [ax, ay, sw, sh] = SVG_ANCHORS[key];
  const { x, y, w, h } = t(SVG_BASE[key], ax, ay, sw, sh, W, H);

  return (
    <g id={`pivot-${side}`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />
    </g>
  );
}
