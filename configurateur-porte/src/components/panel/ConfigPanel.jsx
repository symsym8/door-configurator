import { useState, useEffect, useRef, useMemo } from "react";
import useDoorStore from "../../store/useDoorStore";
import "./ConfigPanel.css";

const INIT_PORTE = { dim: true, cfg: false, trav: false, fin: false };

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

export default function ConfigPanel() {
  const [tab, setTab] = useState("porte");
  const [openPorte, setOpenPorte] = useState(INIT_PORTE);

  const {
    W,
    H,
    ouv,
    ferrage,
    baton,
    fermeture,
    elements,
    selectedId,
    hasImposte,
    impH,
    traversesH,
    setW,
    setH,
    set,
    setImpH,
    updateElementW,
    addTraverseEqualized,
    removeTraverseH,
    updateTraverseH,
    equalizeTraverses,
    layoutQuarterHalf,
    addChassisTraverseH,
    addChassisTraverseV,
    removeChassisTraverse,
    updateChassisTraverse,
    equalizeChassisTraverses,
    syncChassisToPorte,
    addImposteTraverseH,
    addImposteTraverseV,
    removeImposteTraverse,
    updateImposteTraverse,
    equalizeImposteTraverses,
    impTravH,
    impTravV,
    hasImposte2,
    impH2,
    impTravH2,
    impTravV2,
    setImpH2,
    addImposteTraverseH2,
    addImposteTraverseV2,
    removeImposteTraverse2,
    updateImposteTraverse2,
    equalizeImposteTraverses2,
    ralColor,
    setRalColor,
    selectElement,
    hasOuvrant,
  } = useDoorStore();

  const passageL = ferrage === "paumelles" ? W - 175 : W - 205;
  const passageH = H - 80;
  const impW = elements.reduce((sum, el) => sum + el.w, 0);
  const togPorte = (k) => setOpenPorte((s) => ({ ...s, [k]: !s[k] }));

  // Barre d'onglets dynamique
  const tabList = useMemo(() => {
    let cn = 0;
    const tabs = [{ id: "porte", label: "Porte" }];
    for (const el of elements) {
      if (el.type === "ouvrant") continue;
      const label = el.type === "chassis" ? `Châssis ${++cn}` : "PT";
      tabs.push({ id: el.id, label });
    }
    if (hasImposte)
      tabs.push({ id: "imp1", label: hasImposte2 ? "Imposte 1" : "Imposte" });
    if (hasImposte && hasImposte2)
      tabs.push({ id: "imp2", label: "Imposte 2" });
    return tabs;
  }, [elements, hasImposte, hasImposte2]);

  const switchTab = (id) => {
    setTab(id);
    if (id === "porte") selectElement("ouv");
    else selectElement(id);
  };

  // Suit la sélection SVG
  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId === "ouv") setTab("porte");
    else setTab(selectedId);
  }, [selectedId]);

  // Quand un élément est ajouté, ouvre son onglet
  const prevLen = useRef(elements.length);
  useEffect(() => {
    if (elements.length > prevLen.current && selectedId) setTab(selectedId);
    prevLen.current = elements.length;
  }, [elements.length, selectedId]);

  // Si l'onglet actif est supprimé, retour à Porte
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!tabList.find((t) => t.id === tab)) setTab("porte");
  }, [tabList, tab]);

  const activeEl = elements.find((e) => e.id === tab);

  return (
    <aside className="panel">
      {/* Barre d'onglets */}
      <div className="panel__tabs">
        {tabList.map((t) => (
          <button
            key={t.id}
            className={`panel__tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel__body">
        {/* ── Onglet Porte ── */}
        {tab === "porte" && (
          <>
            <Acc
              num="01"
              label="DIMENSIONS"
              open={openPorte.dim}
              onToggle={() => togPorte("dim")}
            >
              <SliderRow
                label="Largeur"
                unit="mm"
                value={W}
                min={500}
                max={1500}
                step={5}
                onChange={setW}
              />
              <SliderRow
                label="Hauteur"
                unit="mm"
                value={H}
                min={2000}
                max={2400}
                step={5}
                onChange={setH}
              />
              {hasOuvrant && (
                <>
                  <div className="passage">
                    <span className="passage__label">Passage libre</span>
                    <span className="passage__value">
                      {passageL} × {passageH} mm
                    </span>
                  </div>
                  {passageH < 1800 && (
                    <div className="warning">⚠ Passage libre &lt; 1800 mm</div>
                  )}
                  {W > 1350 && (
                    <div className="warning">
                      ⚠ Élargisseur recommandé au-delà de 1350 mm
                    </div>
                  )}
                </>
              )}
            </Acc>

            {hasOuvrant && (
              <Acc
                num="02"
                label="CONFIGURATION"
                open={openPorte.cfg}
                onToggle={() => togPorte("cfg")}
              >
                <CfgRow label="Ouverture">
                  <Card2
                    a={{
                      label: "Extérieure",
                      active: ouv === "ext",
                      onClick: () => set("ouv", "ext"),
                    }}
                    b={{
                      label: "Intérieure",
                      active: ouv === "int",
                      onClick: () => set("ouv", "int"),
                    }}
                  />
                </CfgRow>
                <CfgRow label="Ferrage">
                  <Card2
                    a={{
                      label: "Paumelles",
                      sub: "4 réglables",
                      active: ferrage === "paumelles",
                      onClick: () => set("ferrage", "paumelles"),
                    }}
                    b={{
                      label: "Pivot",
                      sub: "Système bas",
                      active: ferrage === "pivot",
                      onClick: () => set("ferrage", "pivot"),
                    }}
                  />
                </CfgRow>
                <CfgRow label="Poignée">
                  <Card2
                    a={{
                      label: "Gauche",
                      active: baton === "g",
                      onClick: () => set("baton", "g"),
                    }}
                    b={{
                      label: "Droite",
                      active: baton === "d",
                      onClick: () => set("baton", "d"),
                    }}
                  />
                  <p className="info-text">
                    Paumelles côté {baton === "d" ? "gauche" : "droite"}
                  </p>
                </CfgRow>
                <CfgRow label="Fermeture">
                  <Card2
                    a={{
                      label: "Ventouse",
                      active: fermeture === "ventouse",
                      onClick: () => set("fermeture", "ventouse"),
                    }}
                    b={{
                      label: "Serrure",
                      active: fermeture === "serrure",
                      onClick: () => set("fermeture", "serrure"),
                    }}
                  />
                  {fermeture === "ventouse" && (
                    <p className="info-text">
                      Bandeau côté {baton === "d" ? "droite" : "gauche"}
                    </p>
                  )}
                </CfgRow>
              </Acc>
            )}

            {hasOuvrant && (
              <Acc
                num="03"
                label="TRAVERSES"
                open={openPorte.trav}
                onToggle={() => togPorte("trav")}
              >
                <TraversesSection
                  traverses={traversesH}
                  H={H}
                  onAdd={addTraverseEqualized}
                  onRemove={removeTraverseH}
                  onChange={updateTraverseH}
                  onEqualize={equalizeTraverses}
                  onQuarterHalf={layoutQuarterHalf}
                />
              </Acc>
            )}

            <Acc
              num="04"
              label="FINITIONS"
              open={openPorte.fin}
              onToggle={() => togPorte("fin")}
            >
              <RalSection ralColor={ralColor} onSelect={setRalColor} />
            </Acc>
          </>
        )}

        {/* ── Onglet Châssis ── */}
        {activeEl?.type === "chassis" && (
          <div className="el-detail">
            <p className="el-section__hd">Dimensions</p>
            <div className="el-card">
              <SliderRow
                label="Largeur"
                unit="mm"
                value={activeEl.w}
                min={150 + (activeEl.travV?.length || 0) * 100}
                max={3500}
                step={10}
                onChange={(v) => updateElementW(activeEl.id, v)}
              />
            </div>

            <p className="el-section__hd">Traverses</p>
            <div className="el-card el-card--subtrav">
              <SubTravSection
                travH={activeEl.travH || []}
                travV={activeEl.travV || []}
                innerH={H - 140}
                innerV={activeEl.w - 140}
                onAddH={() => addChassisTraverseH(activeEl.id)}
                onAddV={() => addChassisTraverseV(activeEl.id)}
                onRemove={(axis, id) =>
                  removeChassisTraverse(activeEl.id, axis, id)
                }
                onUpdate={(axis, id, pos) =>
                  updateChassisTraverse(activeEl.id, axis, id, pos)
                }
                onEqualize={(axis) =>
                  equalizeChassisTraverses(activeEl.id, axis)
                }
              />
            </div>
            {traversesH.length > 0 && (
              <button
                className="sync-btn"
                onClick={() => syncChassisToPorte(activeEl.id)}
              >
                Calquer les traverses de la porte
              </button>
            )}
          </div>
        )}

        {/* ── Onglet Poteau technique ── */}
        {activeEl?.type === "pt" && (
          <div className="el-detail">
            <p className="el-section__hd">Dimensions</p>
            <div className="el-card">
              <SliderRow
                label="Largeur"
                unit="mm"
                value={activeEl.w}
                min={100}
                max={500}
                step={10}
                onChange={(v) => updateElementW(activeEl.id, v)}
              />
            </div>

            <div className="el-card el-card--info">
              <span className="info-icon">ℹ</span>
              <p className="info-text" style={{ margin: 0 }}>
                Réservation interphonie 145 × 398 mm
              </p>
            </div>
          </div>
        )}

        {/* ── Onglet Imposte 1 ── */}
        {tab === "imp1" && hasImposte && (
          <div className="el-detail">
            <p className="el-section__hd">Dimensions</p>
            <div className="el-card">
              <SliderRow
                label="Hauteur"
                unit="mm"
                value={impH}
                min={100}
                max={800}
                step={10}
                onChange={setImpH}
              />
            </div>

            <p className="el-section__hd">Traverses</p>
            <div className="el-card el-card--subtrav">
              <SubTravSection
                travH={impTravH}
                travV={impTravV}
                innerH={impH - 140}
                innerV={impW - 140}
                onAddH={addImposteTraverseH}
                onAddV={() => addImposteTraverseV(impW)}
                onRemove={(axis, id) => removeImposteTraverse(axis, id)}
                onUpdate={(axis, id, pos) =>
                  updateImposteTraverse(axis, id, pos)
                }
                onEqualize={(axis) =>
                  equalizeImposteTraverses(
                    axis,
                    axis === "h" ? impH - 140 : impW - 140,
                  )
                }
              />
            </div>
          </div>
        )}

        {/* ── Onglet Imposte 2 ── */}
        {tab === "imp2" && hasImposte && hasImposte2 && (
          <div className="el-detail">
            <p className="el-section__hd">Dimensions</p>
            <div className="el-card">
              <SliderRow
                label="Hauteur"
                unit="mm"
                value={impH2}
                min={100}
                max={800}
                step={10}
                onChange={setImpH2}
              />
            </div>

            <p className="el-section__hd">Traverses</p>
            <div className="el-card el-card--subtrav">
              <SubTravSection
                travH={impTravH2}
                travV={impTravV2}
                innerH={impH2 - 140}
                innerV={impW - 140}
                onAddH={addImposteTraverseH2}
                onAddV={() => addImposteTraverseV2(impW)}
                onRemove={(axis, id) => removeImposteTraverse2(axis, id)}
                onUpdate={(axis, id, pos) =>
                  updateImposteTraverse2(axis, id, pos)
                }
                onEqualize={(axis) =>
                  equalizeImposteTraverses2(
                    axis,
                    axis === "h" ? impH2 - 140 : impW - 140,
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="panel__footer">
        <div className="footer-dims">
          <span className="footer-dim">
            <span className="footer-val">{W}</span>
            <span className="footer-unit">mm L</span>
          </span>
          <span className="footer-sep">×</span>
          <span className="footer-dim">
            <span className="footer-val">{H}</span>
            <span className="footer-unit">mm H</span>
          </span>
        </div>
        <button className="btn-export">EXPORTER PDF</button>
      </div>
    </aside>
  );
}

/* ── RAL ── */
function RalSection({ ralColor, onSelect }) {
  return (
    <div className="ral-section">
      <div className="ral-grid">
        {RAL_COLORS.map((c) => (
          <button
            key={c.code}
            className={`ral-swatch${ralColor === c.hex ? " is-on" : ""}`}
            title={`RAL ${c.code} — ${c.name}`}
            onClick={() => onSelect(c.hex)}
            style={{ backgroundColor: c.hex }}
          >
            {ralColor === c.hex && (
              <span
                className="ral-check"
                style={{ color: isLight(c.hex) ? "#111" : "#fff" }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
      {RAL_COLORS.find((c) => c.hex === ralColor) && (
        <p className="ral-label">
          RAL {RAL_COLORS.find((c) => c.hex === ralColor).code} —{" "}
          {RAL_COLORS.find((c) => c.hex === ralColor).name}
        </p>
      )}
    </div>
  );
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128;
}

/* ── Traverses ouvrant ── */
function TraversesSection({
  traverses,
  H,
  onAdd,
  onRemove,
  onChange,
  onEqualize,
  onQuarterHalf,
}) {
  const clamp = (v) => Math.max(120, Math.min(H - 245, v));
  return (
    <div className="traverses">
      <div className="trav-add">
        <button
          className="trav-btn"
          disabled={traverses.length >= 3}
          onClick={onAdd}
        >
          + Ajouter
        </button>
      </div>
      {traverses.length === 0 ? (
        <p className="trav-empty">Aucune traverse (max 3)</p>
      ) : (
        <>
          <div className="trav-list">
            {traverses.map((t) => (
              <div key={t.id} className="trav-item">
                <span className="trav-label">H {t.y} mm</span>
                <input
                  className="trav-input"
                  type="number"
                  value={t.y}
                  min={120}
                  max={H - 245}
                  step={50}
                  onChange={(e) =>
                    onChange(t.id, clamp(parseInt(e.target.value) || t.y))
                  }
                />
                <span className="slider-unit">mm</span>
                <button
                  className="el-btn is-del"
                  onClick={() => onRemove(t.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="trav-eq-btn" onClick={onEqualize}>
            Égaliser les zones
          </button>
          {traverses.length === 2 && (
            <button className="trav-eq-btn" onClick={onQuarterHalf}>
              ¼ — ½
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── Sous-composants ── */
function Acc({ num, label, open, onToggle, children }) {
  return (
    <div className="acc">
      <button className="acc__hd" onClick={onToggle}>
        <span className="acc__num">{num}</span>
        <span className="acc__pipe">|</span>
        <span className="acc__lbl">{label}</span>
        <span className={`acc__arr${open ? " is-open" : ""}`}>›</span>
      </button>
      {open && <div className="acc__body">{children}</div>}
    </div>
  );
}

function CfgRow({ label, children }) {
  return (
    <div className="cfg-row">
      <p className="cfg-row__lbl">{label}</p>
      {children}
    </div>
  );
}

function Card2({ a, b }) {
  return (
    <div className="card2">
      <button
        className={`card2__btn${a.active ? " is-on" : ""}`}
        onClick={a.onClick}
      >
        <span className="card2__name">{a.label}</span>
        {a.sub && <span className="card2__sub">{a.sub}</span>}
      </button>
      <button
        className={`card2__btn${b.active ? " is-on" : ""}`}
        onClick={b.onClick}
      >
        <span className="card2__name">{b.label}</span>
        {b.sub && <span className="card2__sub">{b.sub}</span>}
      </button>
    </div>
  );
}

function SliderRow({ label, unit, value, min, max, step, onChange }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRaw(String(value));
  }, [value]);
  const commit = () => {
    const v = parseInt(raw, 10);
    if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
    else setRaw(String(value));
  };
  return (
    <div className="slider-row">
      <div className="slider-hd">
        <span className="slider-label">{label}</span>
        <div className="slider-val">
          <input
            type="number"
            value={raw}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
          />
          <span className="slider-unit">{unit}</span>
        </div>
      </div>
      <input
        className="slider-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
    </div>
  );
}

function SubTravAxis({
  label,
  travs,
  innerSize,
  axis,
  onAdd,
  onRemove,
  onUpdate,
  onEqualize,
}) {
  const clamp = (v) => Math.max(10, Math.min(innerSize - 100, v));
  return (
    <div className="subtrav__axis">
      <div className="subtrav__axis-hd">
        <span className="subtrav__axis-lbl">{label}</span>
        <button
          className="trav-btn"
          disabled={travs.length >= 3}
          onClick={onAdd}
        >
          + Ajouter
        </button>
      </div>
      {travs.length > 0 && (
        <>
          <div className="trav-list">
            {travs.map((t) => (
              <div key={t.id} className="trav-item">
                <span className="trav-label">{Math.round(t.pos)} mm</span>
                <input
                  className="trav-input"
                  type="number"
                  value={Math.round(t.pos)}
                  min={10}
                  max={innerSize - 100}
                  step={5}
                  onChange={(e) =>
                    onUpdate(
                      axis,
                      t.id,
                      clamp(parseInt(e.target.value) || t.pos),
                    )
                  }
                />
                <span className="slider-unit">mm</span>
                <button
                  className="el-btn is-del"
                  onClick={() => onRemove(axis, t.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="trav-eq-btn" onClick={() => onEqualize(axis)}>
            Égaliser
          </button>
        </>
      )}
    </div>
  );
}

function SubTravSection({
  travH,
  travV,
  innerH,
  innerV,
  onAddH,
  onAddV,
  onRemove,
  onUpdate,
  onEqualize,
}) {
  return (
    <div className="subtrav">
      <SubTravAxis
        label="Traverses H"
        travs={travH}
        innerSize={innerH}
        axis="h"
        onAdd={onAddH}
        onRemove={onRemove}
        onUpdate={onUpdate}
        onEqualize={onEqualize}
      />
      <SubTravAxis
        label="Traverses V"
        travs={travV}
        innerSize={innerV}
        axis="v"
        onAdd={onAddV}
        onRemove={onRemove}
        onUpdate={onUpdate}
        onEqualize={onEqualize}
      />
    </div>
  );
}
