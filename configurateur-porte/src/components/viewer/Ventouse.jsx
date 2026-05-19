import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import useDoorStore from "../../store/useDoorStore";

export default function Ventouse({ W, H, side }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const key = side === "d" ? "bvd" : "bvg";
  const [ax, ay, sw, sh] = SVG_ANCHORS[key];
  const { x, y, w, h } = t(SVG_BASE[key], ax, ay, sw, sh, W, H);

  return (
    <g id="bandeau-ventouse">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={ralColor}
        opacity="0.88"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </g>
  );
}
