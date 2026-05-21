import { jsPDF } from "jspdf";

const RAL_COLORS = [
  { code: "7016", name: "Gris anthracite", hex: "#373f43" },
  { code: "9005", name: "Noir foncé", hex: "#0e0e10" },
  { code: "9010", name: "Blanc pur", hex: "#f5f4ef" },
  { code: "9016", name: "Blanc signalisation", hex: "#f0f0ec" },
  { code: "7035", name: "Gris clair", hex: "#cdd1c4" },
  { code: "9006", name: "Blanc aluminium", hex: "#a7a8a8" },
  { code: "9007", name: "Gris aluminium", hex: "#898176" },
  { code: "7015", name: "Gris ardoise", hex: "#3d4348" },
  { code: "5010", name: "Bleu gentiane", hex: "#0e4c7a" },
  { code: "5013", name: "Bleu cobalt", hex: "#1e3359" },
  { code: "3000", name: "Rouge feu", hex: "#ab2117" },
  { code: "6005", name: "Vert mousse", hex: "#114232" },
  { code: "6003", name: "Vert olive", hex: "#515a40" },
  { code: "8014", name: "Brun sépia", hex: "#4a3225" },
  { code: "8017", name: "Brun chocolat", hex: "#392d23" },
  { code: "1013", name: "Blanc perlé", hex: "#e6dfd1" },
];

function getRalInfo(hex) {
  return RAL_COLORS.find((c) => c.hex === hex) ?? null;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

async function svgToPng(svgEl, targetW = 1400) {
  return new Promise((resolve, reject) => {
    const vb = svgEl.viewBox.baseVal;
    if (!vb || vb.width === 0) {
      reject(new Error("SVG viewBox invalide"));
      return;
    }
    const ratio = vb.width / vb.height;
    const canvasW = targetW;
    const canvasH = Math.round(targetW / ratio);

    const clone = svgEl.cloneNode(true);
    clone.setAttribute("width", canvasW);
    clone.setAttribute("height", canvasH);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const svgStr = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgStr], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#F2F2F7";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, 0, 0, canvasW, canvasH);
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Échec de la conversion SVG → PNG"));
    };
    img.src = url;
  });
}

export async function exportPDF(state) {
  const {
    W,
    H,
    ouv,
    ferrage,
    baton,
    fermeture,
    hasOuvrant,
    elements,
    traversesH,
    impostes,
    ralColor,
  } = state;

  const svgEl = document.querySelector(".viewer__svg");
  if (!svgEl) {
    alert("Impossible de trouver le viewer SVG.");
    return;
  }

  const pngData = await svgToPng(svgEl);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const M = 14;
  const PW = 210;
  const PH = 297;
  const CW = PW - 2 * M;

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // ── En-tête coloré ──────────────────────────────────────
  const [hr, hg, hb] = hexToRgb(ralColor);
  doc.setFillColor(hr, hg, hb);
  doc.rect(0, 0, PW, 20, "F");

  const isLight = hr * 0.299 + hg * 0.587 + hb * 0.114 > 128;
  const textR = isLight ? 0 : 255;
  doc.setTextColor(textR, textR, textR);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PORTE DE HALL — DESCRIPTIF TECHNIQUE", M, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(dateStr, PW - M, 13, { align: "right" });

  doc.setTextColor(0, 0, 0);

  // ── Image SVG ───────────────────────────────────────────
  const IMG_TOP = 24;
  const IMG_MAX_H = 105;
  const vb = svgEl.viewBox.baseVal;
  const ratio = vb.width / vb.height;
  let imgW = CW;
  let imgH = imgW / ratio;
  if (imgH > IMG_MAX_H) {
    imgH = IMG_MAX_H;
    imgW = imgH * ratio;
  }
  const imgX = M + (CW - imgW) / 2;

  doc.addImage(pngData, "PNG", imgX, IMG_TOP, imgW, imgH);

  // Séparateur
  let y = IMG_TOP + imgH + 7;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  doc.line(M, y, PW - M, y);
  y += 6;

  // ── Helpers ─────────────────────────────────────────────
  const COL_LBL = M + 2;
  const COL_VAL = M + 58;

  function sectionTitle(text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(text, COL_LBL, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
  }

  function specRow(label, value) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label, COL_LBL, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), COL_VAL, y);
    y += 5.5;
  }

  function divider() {
    y += 2;
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.line(M, y, PW - M, y);
    y += 5;
  }

  // ── Dimensions ──────────────────────────────────────────
  sectionTitle("DIMENSIONS");

  const totalWidth = elements.reduce((sum, e) => {
    if (e.type === "ouvrant" && !hasOuvrant) return sum;
    return sum + e.w;
  }, 0);

  specRow("Largeur totale", `${totalWidth} mm`);
  specRow("Hauteur", `${H} mm`);

  if (hasOuvrant) {
    const passageL = ferrage === "paumelles" ? W - 175 : W - 205;
    const passageH = H - 80;
    specRow("Passage libre", `${passageL} × ${passageH} mm`);
  }

  divider();

  // ── Configuration ────────────────────────────────────────
  if (hasOuvrant) {
    sectionTitle("CONFIGURATION");
    specRow("Ouverture", ouv === "ext" ? "Extérieure" : "Intérieure");
    specRow(
      "Ferrage",
      ferrage === "paumelles"
        ? "Paumelles — 4 réglables"
        : "Pivot — système bas",
    );
    specRow("Poignée", baton === "g" ? "Gauche" : "Droite");
    specRow("Fermeture", fermeture === "ventouse" ? "Ventouse" : "Serrure");
    divider();
  }

  // ── Finitions ────────────────────────────────────────────
  sectionTitle("FINITIONS");
  const ralInfo = getRalInfo(ralColor);
  const ralLabel = ralInfo ? `RAL ${ralInfo.code} — ${ralInfo.name}` : ralColor;

  // Pastille de couleur
  const [cr, cg, cb] = hexToRgb(ralColor);
  doc.setFillColor(cr, cg, cb);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.roundedRect(COL_VAL, y - 4, 5, 4.5, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(ralLabel, COL_VAL + 7, y);
  y += 5.5;

  divider();

  // ── Éléments ─────────────────────────────────────────────
  sectionTitle("ÉLÉMENTS");
  let cn = 0;

  elements.forEach((el) => {
    if (el.type === "ouvrant") {
      if (hasOuvrant) {
        let traverseDesc = "";
        if (traversesH.length > 0) {
          traverseDesc = ` — ${traversesH.length} traverse${traversesH.length > 1 ? "s" : ""} H`;
        }
        specRow("Ouvrant", `${W} mm${traverseDesc}`);
      }
    } else if (el.type === "chassis") {
      cn++;
      const elH = el.h ?? H;
      const nH = el.travH?.length || 0;
      const nV = el.travV?.length || 0;
      const travParts = [];
      if (nH) travParts.push(`${nH} trav. H`);
      if (nV) travParts.push(`${nV} trav. V`);
      const travDesc = travParts.length ? ` — ${travParts.join(", ")}` : "";
      const hDesc = elH !== H ? ` (H ${elH} mm)` : "";
      specRow(`Châssis ${cn}`, `${el.w} mm${hDesc}${travDesc}`);
    } else if (el.type === "pt") {
      specRow(
        "Poteau technique",
        `${el.w} mm — réserv. interphonie 145 × 398 mm`,
      );
    }
  });

  // ── Traverses ouvrant ────────────────────────────────────
  if (traversesH.length > 0 && hasOuvrant) {
    y += 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Positions traverses", COL_LBL, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const posStr = traversesH
      .map((t, i) => `T${i + 1} : ${t.y} mm`)
      .join("   ");
    doc.text(posStr, COL_VAL, y);
    y += 5.5;
  }

  // ── Impostes ─────────────────────────────────────────────
  if (impostes.length > 0) {
    divider();
    sectionTitle("IMPOSTES");
    const row0 = impostes.filter((i) => i.row === 0);
    const row1 = impostes.filter((i) => i.row === 1);

    row0.forEach((imp, idx) => {
      const label =
        row0.length === 1 && row1.length === 0
          ? "Imposte"
          : `Imposte ${idx + 1}`;
      const nH = imp.travH?.length || 0;
      const nV = imp.travV?.length || 0;
      const travParts = [];
      if (nH) travParts.push(`${nH} trav. H`);
      if (nV) travParts.push(`${nV} trav. V`);
      const travDesc = travParts.length ? ` — ${travParts.join(", ")}` : "";
      specRow(label, `H = ${imp.h} mm${travDesc}`);
    });

    row1.forEach((imp, idx) => {
      const label = row1.length === 1 ? "Imposte 2" : `Imposte 2.${idx + 1}`;
      const nH = imp.travH?.length || 0;
      const nV = imp.travV?.length || 0;
      const travParts = [];
      if (nH) travParts.push(`${nH} trav. H`);
      if (nV) travParts.push(`${nV} trav. V`);
      const travDesc = travParts.length ? ` — ${travParts.join(", ")}` : "";
      specRow(label, `H = ${imp.h} mm${travDesc}`);
    });
  }

  // ── Pied de page ──────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(170, 170, 170);
  doc.text(
    "Document généré automatiquement — Configurateur de porte de hall",
    M,
    PH - 8,
  );
  doc.text(new Date().toLocaleString("fr-FR"), PW - M, PH - 8, {
    align: "right",
  });

  doc.save(`descriptif-porte-${W}x${H}-${dateStr.replace(/\//g, "-")}.pdf`);
}
