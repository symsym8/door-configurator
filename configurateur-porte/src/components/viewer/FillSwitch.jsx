import useDoorStore from "../../store/useDoorStore";

const VITRAGE_COLOR = "#c8e8f8";

export default function FillSwitch({
  cx,
  cy,
  type,
  onVitrage,
  onTole,
  scale = 1,
}) {
  const ralColor = useDoorStore((s) => s.ralColor);

  const TW = 132;
  const TH = 78;
  const TR = TH / 2;
  const thumbR = TR - 5;
  const PAD = 10;

  const vitrageActive = type === "vitrage";
  const thumbX = vitrageActive ? cx - TW / 2 + TR : cx + TW / 2 - TR;
  const trackColor = vitrageActive ? VITRAGE_COLOR : ralColor;

  const handleToggle = (e) => {
    e.stopPropagation();
    vitrageActive ? onTole() : onVitrage();
  };

  const transform =
    scale !== 1
      ? `translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`
      : undefined;

  return (
    <g
      style={{ userSelect: "none" }}
      onMouseDown={(e) => e.stopPropagation()}
      transform={transform}
    >
      <rect
        x={cx - TW / 2 - PAD}
        y={cy - TR - PAD}
        width={TW + PAD * 2}
        height={TH + PAD * 2}
        rx={TR + PAD}
        fill="rgba(255,255,255,0.75)"
        style={{ filter: "drop-shadow(0px 1px 4px rgba(0,0,0,0.10))" }}
      />
      <rect
        x={cx - TW / 2}
        y={cy - TR}
        width={TW}
        height={TH}
        rx={TR}
        fill={trackColor}
        cursor="pointer"
        onClick={handleToggle}
      />
      <circle
        cx={thumbX}
        cy={cy}
        r={thumbR}
        fill="#ffffff"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="2"
        cursor="pointer"
        style={{
          filter:
            "drop-shadow(0px 3px 6px rgba(0,0,0,0.22)) drop-shadow(0px 1px 2px rgba(0,0,0,0.12))",
        }}
        onClick={handleToggle}
      />
    </g>
  );
}
