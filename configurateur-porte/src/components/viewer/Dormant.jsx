import { SVG_BASE, SVG_ANCHORS, t } from "../../utils/svgCoords";
import useDoorStore from "../../store/useDoorStore";

const INOX_COLOR = "#c8c8c8";

export default function Dormant({ W, H }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const r = (key) => {
    const [ax, ay, sw, sh] = SVG_ANCHORS[key];
    return t(SVG_BASE[key], ax, ay, sw, sh, W, H);
  };

  const mg = r("d_mg");
  const md = r("d_md");
  const th = r("d_th");
  const seuil = r("d_seuil");
  const cext = r("d_cext");
  const cint = r("d_cint");

  return (
    <g id="dormant">
      {/* Fills — aucun stroke, les contours sont dessinés par-dessus */}
      <rect x={mg.x} y={mg.y} width={mg.w} height={mg.h} fill={ralColor} />
      <rect x={md.x} y={md.y} width={md.w} height={md.h} fill={ralColor} />
      <rect x={th.x} y={th.y} width={th.w} height={th.h} fill={ralColor} />
      <rect
        x={seuil.x}
        y={seuil.y}
        width={seuil.w}
        height={seuil.h}
        fill={INOX_COLOR}
      />
      {/* Contours — dessinés en dernier pour être sur le dessus */}
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
