import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import useDoorStore from "../../store/useDoorStore";

const FILL_COLOR = "#c8e8f8";

function getPrefix(ferrage, baton) {
  if (ferrage === "paumelles") return "op";
  return baton === "d" ? "og" : "od";
}

function useRects(W, H, ferrage, baton) {
  const prefix = getPrefix(ferrage, baton);
  const r = (key) => {
    const [ax, ay, sw, sh] = SVG_ANCHORS[key];
    return t(SVG_BASE[key], ax, ay, sw, sh, W, H);
  };
  return { prefix, r };
}

export default function Ouvrant({ W, H, ferrage, baton }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const { prefix, r } = useRects(W, H, ferrage, baton);

  const rem = r(`${prefix}_rem`);
  const mg = r(`${prefix}_mg`);
  const md = r(`${prefix}_md`);
  const th = r(`${prefix}_th`);
  const tb = r(`${prefix}_tb`);
  const cext = r(`${prefix}_cext`);
  const cint = r(`${prefix}_cint`);

  return (
    <g id="ouvrant">
      <rect
        x={rem.x}
        y={rem.y}
        width={rem.w}
        height={rem.h}
        fill={FILL_COLOR}
      />
      <rect x={mg.x} y={mg.y} width={mg.w} height={mg.h} fill={ralColor} />
      <rect x={md.x} y={md.y} width={md.w} height={md.h} fill={ralColor} />
      <rect x={th.x} y={th.y} width={th.w} height={th.h} fill={ralColor} />
      <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} fill={ralColor} />
      <rect
        x={cext.x}
        y={cext.y}
        width={cext.w}
        height={cext.h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />
      <rect
        x={cint.x}
        y={cint.y}
        width={cint.w}
        height={cint.h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />
    </g>
  );
}

export function OuvrantContour({ W, H, ferrage, baton }) {
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const { prefix, r } = useRects(W, H, ferrage, baton);
  const cext = r(`${prefix}_cext`);
  const cint = r(`${prefix}_cint`);

  return (
    <g id="ouvrant-contour" pointerEvents="none">
      <rect
        x={cext.x}
        y={cext.y}
        width={cext.w}
        height={cext.h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />
      <rect
        x={cint.x}
        y={cint.y}
        width={cint.w}
        height={cint.h}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />
    </g>
  );
}
