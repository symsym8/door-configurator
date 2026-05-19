import { calcPaumelles, calcPaumellesX } from "../../utils/paumellesCalc";
import useDoorStore from "../../store/useDoorStore";

const INOX_COLOR = "#c8c8c8";
const CORP_W = 20;
const CORP_H = 146;
const ROND_H = 6;
const ROND_DY = 70;

export default function Paumelles({ W, H, side }) {
  const ralColor = useDoorStore((s) => s.ralColor);
  const strokeColor = useDoorStore((s) => s.strokeColor);
  const ys = calcPaumelles(H);
  const x = calcPaumellesX(side, W);

  return (
    <g id="paumelles">
      {ys.map((y, i) => (
        <g key={i}>
          <rect
            x={x}
            y={y}
            width={CORP_W}
            height={CORP_H}
            fill={ralColor}
            stroke={strokeColor}
            strokeWidth="1"
          />
          <rect
            x={x}
            y={y + ROND_DY}
            width={CORP_W}
            height={ROND_H}
            fill={INOX_COLOR}
            stroke={strokeColor}
            strokeWidth="1"
          />
        </g>
      ))}
    </g>
  );
}
