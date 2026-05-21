import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import { RY } from "../../constants/svgRef";
import useDoorStore from "../../store/useDoorStore";

export default function Pivot({ W, H, side }) {
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const key = side === "g" ? "pivot_g" : "pivot_d";
  const [ax, ay, sw, sh] = SVG_ANCHORS[key];
  const { x, y, w, h } = t(SVG_BASE[key], ax, ay, sw, sh, W, H);

  // S'arrête juste avant le seuil (seuil démarre à RY + H - 10)
  const seuilY = RY + H - 10;
  const clipId = `pivot-clip-${side}`;

  return (
    <g id={`pivot-${side}`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x - 2} y={y - 2} width={w + 4} height={seuilY - y + 2} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}

export function PivotBas({ W, H, side }) {
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const ralColor = useDoorStore((s) => s.ralColor);
  const key = side === "g" ? "pivot_g_bas" : "pivot_d_bas";
  const [ax, ay, sw, sh] = SVG_ANCHORS[key];
  const { x, y, w, h } = t(SVG_BASE[key], ax, ay, sw, sh, W, H);

  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={ralColor}
      stroke={strokeColor}
      strokeWidth="1"
    />
  );
}
