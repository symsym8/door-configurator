export function calcPaumelles(H) {
  const RY = 2000;
  const DT = 70;
  const DS = 10;
  const PAUM_H = 146;

  const refH = RY + DT;
  const refB = RY + H - DS;

  const p4y = refH + 130;
  const p3y = refH + 130 + 300;
  const p1y = refB - 130 - PAUM_H;
  const p2y = (p3y + PAUM_H + p1y) / 2 - PAUM_H / 2;

  return [p4y, p3y, p2y, p1y];
}

export function calcPaumellesX(side, W) {
  const RX = 3500;
  const DM = 70;
  return side === "g" ? RX + 46 : RX + W - DM + 4;
}
