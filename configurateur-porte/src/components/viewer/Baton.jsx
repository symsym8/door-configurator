import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import useDoorStore from "../../store/useDoorStore";

const INOX_COLOR = "#c8c8c8";

export default function Baton({ W, H, side }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const prefix = side === "d" ? "bd" : "bg";

  const r = (key) => {
    const [ax, ay, sw, sh] = SVG_ANCHORS[key];
    return t(SVG_BASE[key], ax, ay, sw, sh, W, H);
  };

  const ph = r(`${prefix}_ph`);
  const pb = r(`${prefix}_pb`);
  const bi = r(`${prefix}_bi`);
  const pv = r(`${prefix}_pv`);

  return (
    <g id={`baton-${side}`}>
      <rect
        x={ph.x}
        y={ph.y}
        width={ph.w}
        height={ph.h}
        fill={ralColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
      <rect
        x={pb.x}
        y={pb.y}
        width={pb.w}
        height={pb.h}
        fill={ralColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
      <rect
        x={bi.x}
        y={bi.y}
        width={bi.w}
        height={bi.h}
        fill={INOX_COLOR}
        stroke={strokeColor}
        strokeWidth="1"
      />
      <rect
        x={pv.x}
        y={pv.y}
        width={pv.w}
        height={pv.h}
        fill={ralColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
    </g>
  );
}
