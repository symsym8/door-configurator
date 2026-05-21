import { useState, useEffect, useRef, useMemo } from "react";
import useDoorStore from "../../store/useDoorStore";
import { calcImpW } from "../../utils/impUtils";
import { exportPDF } from "../../utils/pdfExport";
import "./ConfigPanel.css";

const INIT_PORTE = { dim: false, cfg: false, trav: false, fin: false };

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
  const [tab, setTab] = useState("generale");
  const [openPorte, setOpenPorte] = useState(INIT_PORTE);
  const [openGen, setOpenGen] = useState({
    profil: false,
    vit: false,
    fp: false,
    ral: false,
  });
  const tabsRef = useRef(null);

  const {
    W,
    H,
    ouv,
    ferrage,
    baton,
    fermeture,
    fermePorte,
    profil,
    vitrage,
    elements,
    selectedId,
    impostes,
    traversesH,
    setW,
    setH,
    set,
    setImposteH,
    updateElementW,
    updateElementH,
    removeElement,
    addElement,
    toggleOuvrant,
    toggleImposteRow,
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
    addImpTravH,
    addImpTravV,
    removeImpTrav,
    updateImpTrav,
    equalizeImpTravs,
    alignImposteToEls,
    splitImposte,
    mergeImposteRow,
    ralColor,
    setRalColor,
    selectElement,
    hasOuvrant,
    elargisseursH,
    toggleElargisseurH,
    setElargisseurHH,
  } = useDoorStore();

  const passageL = ferrage === "paumelles" ? W - 175 : W - 205;
  const passageH = H - 80;
  const togPorte = (k) => setOpenPorte((s) => ({ ...s, [k]: !s[k] }));

  // Barre d'onglets dynamique (sans Générale — bouton fixe séparé)
  const tabList = useMemo(() => {
    let cn = 0;
    const tabs = [];
    for (const el of elements) {
      if (el.type === "ouvrant") {
        if (hasOuvrant) tabs.push({ id: "porte", label: "Porte" });
      } else if (el.type === "chassis") {
        tabs.push({ id: el.id, label: `Châssis ${++cn}` });
      } else if (el.type === "pt") {
        tabs.push({ id: el.id, label: "PT" });
      } else if (el.type === "elargisseur") {
        tabs.push({ id: el.id, label: "Élarg." });
      }
    }
    const row0 = impostes.filter((i) => i.row === 0);
    const row1 = impostes.filter((i) => i.row === 1);
    row0.forEach((imp, idx) => {
      const label =
        row0.length === 1 && row1.length === 0 ? "Imposte" : `Imp.${idx + 1}`;
      tabs.push({ id: imp.id, label });
    });
    row1.forEach((imp, idx) => {
      const label = row1.length === 1 ? "Imposte 2" : `Imp.2.${idx + 1}`;
      tabs.push({ id: imp.id, label });
    });
    elargisseursH.forEach((elh) => {
      tabs.push({ id: elh.id, label: "Élarg. H" });
    });
    return tabs;
  }, [elements, impostes, hasOuvrant, elargisseursH]);

  const switchTab = (id) => {
    setTab(id);
    if (id === "generale") return;
    if (id === "porte") selectElement("ouv");
    else selectElement(id);
  };

  // Suit la sélection SVG
  useEffect(() => {
    if (!selectedId) return;
    if (selectedId === "ouv") setTab(hasOuvrant ? "porte" : "generale");
    else setTab(selectedId);
  }, [selectedId, hasOuvrant]);

  // Quand un élément est ajouté, ouvre son onglet
  const prevLen = useRef(elements.length);
  const prevElhLen = useRef(elargisseursH.length);
  useEffect(() => {
    const grew =
      elements.length > prevLen.current ||
      elargisseursH.length > prevElhLen.current;
    if (grew && selectedId) setTab(selectedId);
    prevLen.current = elements.length;
    prevElhLen.current = elargisseursH.length;
  }, [elements.length, elargisseursH.length, selectedId]);

  // Si l'onglet actif est supprimé ET qu'il reste des éléments, retour à Générale
  useEffect(() => {
    if (
      tab !== "generale" &&
      tabList.length > 0 &&
      !tabList.find((t) => t.id === tab)
    )
      setTab("generale");
  }, [tabList, tab]);

  // Centre l'onglet actif dans la barre scrollable
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const active = el.querySelector(".panel__tab.is-active");
    if (!active) return;
    el.scrollTo({
      left: active.offsetLeft - el.offsetWidth / 2 + active.offsetWidth / 2,
      behavior: "smooth",
    });
  }, [tab]);

  const getTabDim = (t) => {
    if (t.id === "generale") return "";
    const el = elements.find((e) => e.id === t.id);
    const imp = impostes.find((i) => i.id === t.id);
    const elh = elargisseursH.find((e) => e.id === t.id);
    return t.id === "porte"
      ? `${W} × ${H}`
      : el
        ? `${el.w} mm`
        : imp
          ? `H ${imp.h}`
          : elh
            ? `H ${elh.h}`
            : "";
  };

  const activeEl = elements.find((e) => e.id === tab);
  const activeImp = impostes.find((i) => i.id === tab);

  const hasPT = elements.some((e) => e.type === "pt");
  const hasImposte = impostes.some((i) => i.row === 0);
  const hasElargH = elargisseursH.length > 0;

  return (
    <aside className="panel">
      {/* Barre d'ajout rapide — mobile uniquement */}
      <div className="mobile-add-bar">
        {!hasOuvrant && (
          <button className="mobile-add-btn" onClick={toggleOuvrant}>
            + Porte
          </button>
        )}
        <button
          className="mobile-add-btn"
          onClick={() => addElement("chassis")}
        >
          + Châssis
        </button>
        {!hasPT && (
          <button className="mobile-add-btn" onClick={() => addElement("pt")}>
            + PT
          </button>
        )}
        {!hasImposte && (
          <button
            className="mobile-add-btn"
            onClick={() => toggleImposteRow(0)}
          >
            + Imposte
          </button>
        )}
        <button
          className="mobile-add-btn"
          onClick={() => addElement("elargisseur")}
        >
          + Élarg.
        </button>
        {!hasElargH && (
          <button className="mobile-add-btn" onClick={toggleElargisseurH}>
            + Élarg. H
          </button>
        )}
      </div>

      {/* Bouton Générale fixe */}
      <div className="panel__gen-bar">
        <button
          className={`panel__gen-btn${tab === "generale" ? " is-active" : ""}`}
          onClick={() => switchTab("generale")}
        >
          Générale
        </button>
      </div>

      {/* Barre d'onglets éléments avec centrage auto + flèche */}
      {tabList.length > 0 && (
        <div className="panel__tab-section">
          <div className="panel__tabs" ref={tabsRef}>
            {tabList.map((t) => (
              <button
                key={t.id}
                data-tab-id={t.id}
                className={`panel__tab${tab === t.id ? " is-active" : ""}`}
                onClick={() => switchTab(t.id)}
              >
                <span className="tab__label">{t.label}</span>
                <span className="tab__dim">{getTabDim(t)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`panel__body${tab === "generale" ? " panel__body--gen" : ""}`}
      >
        {/* ── Onglet Générale ── */}
        {tab === "generale" && (
          <>
            <Acc
              num="01"
              label="PROFIL"
              summary={PROFIL_OPTIONS.find((o) => o.value === profil)?.label}
              open={openGen.profil}
              onToggle={() => setOpenGen((s) => ({ ...s, profil: !s.profil }))}
            >
              <ProfilSection
                profil={profil}
                onChange={(v) => set("profil", v)}
              />
            </Acc>

            <Acc
              num="02"
              label="VITRAGE"
              summary={vitrage || "—"}
              open={openGen.vit}
              onToggle={() => setOpenGen((s) => ({ ...s, vit: !s.vit }))}
            >
              <VitrageSection
                vitrage={vitrage}
                onChange={(v) => set("vitrage", v)}
              />
            </Acc>

            <Acc
              num="03"
              label="FERME-PORTE"
              summary={
                fermePorte === "ts93" ? "Applique TS 93" : "Encastré ITS 96"
              }
              open={openGen.fp}
              onToggle={() => setOpenGen((s) => ({ ...s, fp: !s.fp }))}
            >
              <Card2
                a={{
                  label: "Applique",
                  sub: "TS 93",
                  active: fermePorte === "ts93",
                  onClick: () => set("fermePorte", "ts93"),
                }}
                b={{
                  label: "Encastré",
                  sub: "ITS 96",
                  active: fermePorte === "its96",
                  onClick: () => set("fermePorte", "its96"),
                }}
              />
            </Acc>

            <Acc
              num="04"
              label="FINITION RAL"
              summary={
                RAL_COLORS.find((c) => c.hex === ralColor)?.code
                  ? `RAL ${RAL_COLORS.find((c) => c.hex === ralColor).code}`
                  : "Personnalisé"
              }
              open={openGen.ral}
              onToggle={() => setOpenGen((s) => ({ ...s, ral: !s.ral }))}
            >
              <RalSection ralColor={ralColor} onSelect={setRalColor} />
            </Acc>
          </>
        )}

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
              <SliderRow
                label="Hauteur"
                unit="mm"
                value={activeEl.h ?? H}
                min={200 + (activeEl.travH?.length || 0) * 100}
                max={H}
                step={10}
                onChange={(v) => updateElementH(activeEl.id, v)}
              />
            </div>

            <p className="el-section__hd">Traverses</p>
            <div className="el-card el-card--subtrav">
              <SubTravSection
                travH={activeEl.travH || []}
                travV={activeEl.travV || []}
                innerH={(activeEl.h ?? H) - 140}
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
                min={180}
                max={350}
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

        {/* ── Onglet Élargisseur ── */}
        {activeEl?.type === "elargisseur" && (
          <div className="el-detail">
            <p className="el-section__hd">Largeur</p>
            <div className="el-card">
              <div
                className="card2"
                style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
              >
                {[50, 80, 100, 150].map((w) => (
                  <button
                    key={w}
                    className={`card2__btn${activeEl.w === w ? " is-on" : ""}`}
                    onClick={() => updateElementW(activeEl.id, w)}
                  >
                    <span className="card2__name">{w}</span>
                    <span className="card2__sub">mm</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              className="delete-btn"
              onClick={() => removeElement(activeEl.id)}
            >
              Supprimer
            </button>
          </div>
        )}

        {/* ── Onglet Élargisseur horizontal ── */}
        {elargisseursH.find((e) => e.id === tab) &&
          (() => {
            const elh = elargisseursH.find((e) => e.id === tab);
            return (
              <div className="el-detail">
                <p className="el-section__hd">Hauteur</p>
                <div className="el-card">
                  <div
                    className="card2"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
                  >
                    {[50, 80, 100, 150].map((h) => (
                      <button
                        key={h}
                        className={`card2__btn${elh.h === h ? " is-on" : ""}`}
                        onClick={() => setElargisseurHH(elh.id, h)}
                      >
                        <span className="card2__name">{h}</span>
                        <span className="card2__sub">mm</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button className="delete-btn" onClick={toggleElargisseurH}>
                  Supprimer
                </button>
              </div>
            );
          })()}

        {/* ── Onglet Imposte (générique) ── */}
        {activeImp && (
          <ImpostePanel
            imp={activeImp}
            elements={elements}
            hasOuvrant={hasOuvrant}
            impostes={impostes}
            onSetH={(h) => setImposteH(activeImp.id, h)}
            onAddTravH={() => addImpTravH(activeImp.id)}
            onAddTravV={() =>
              addImpTravV(
                activeImp.id,
                calcImpW(activeImp, elements, hasOuvrant),
              )
            }
            onRemoveTrav={(axis, id) => removeImpTrav(activeImp.id, axis, id)}
            onUpdateTrav={(axis, id, pos) =>
              updateImpTrav(activeImp.id, axis, id, pos)
            }
            onEqualize={(axis) =>
              equalizeImpTravs(
                activeImp.id,
                axis,
                axis === "h"
                  ? activeImp.h - 140
                  : calcImpW(activeImp, elements, hasOuvrant) - 140,
              )
            }
            onAlignToEls={() => alignImposteToEls(activeImp.id)}
            onSplit={() => splitImposte(activeImp.id)}
            onMerge={() => mergeImposteRow(activeImp.row)}
          />
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
        <button
          className="btn-export"
          onClick={() => exportPDF(useDoorStore.getState())}
        >
          EXPORTER PDF
        </button>
      </div>
    </aside>
  );
}

/* ── Panel imposte générique ── */
function ImpostePanel({
  imp,
  elements,
  hasOuvrant,
  impostes,
  onSetH,
  onAddTravH,
  onAddTravV,
  onRemoveTrav,
  onUpdateTrav,
  onEqualize,
  onAlignToEls,
  onSplit,
  onMerge,
}) {
  const impW = calcImpW(imp, elements, hasOuvrant);
  const rowCount = impostes.filter((i) => i.row === imp.row).length;
  const visibleEls = elements.filter(
    (e) =>
      imp.coveredIds.includes(e.id) && !(e.type === "ouvrant" && !hasOuvrant),
  );

  return (
    <div className="el-detail">
      <p className="el-section__hd">Dimensions</p>
      <div className="el-card">
        <SliderRow
          label="Hauteur"
          unit="mm"
          value={imp.h}
          min={100}
          max={800}
          step={10}
          onChange={onSetH}
        />
        {impW > 0 && (
          <div className="passage">
            <span className="passage__label">Largeur</span>
            <span className="passage__value">{impW} mm</span>
          </div>
        )}
      </div>

      <p className="el-section__hd">Traverses</p>
      <div className="el-card el-card--subtrav">
        <SubTravSection
          travH={imp.travH}
          travV={imp.travV}
          innerH={imp.h - 140}
          innerV={impW - 140}
          onAddH={onAddTravH}
          onAddV={onAddTravV}
          onRemove={onRemoveTrav}
          onUpdate={onUpdateTrav}
          onEqualize={onEqualize}
        />
      </div>

      {visibleEls.length > 1 && (
        <button className="sync-btn" onClick={onAlignToEls}>
          Calquer les éléments
        </button>
      )}

      <p className="el-section__hd">Division</p>
      <div className="el-card">
        {visibleEls.length > 1 ? (
          <button className="sync-btn" onClick={onSplit}>
            Diviser par élément ({visibleEls.length})
          </button>
        ) : (
          <p className="info-text">Imposte sur 1 élément — non divisible</p>
        )}
        {rowCount > 1 && (
          <button
            className="sync-btn"
            style={{ marginTop: 8 }}
            onClick={onMerge}
          >
            Fusionner toutes ({rowCount})
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Vitrage ── */
const VITRAGE_PRESETS = [
  "STADIP 44.2",
  "STADIP 44.2/6/44.2",
  "STADIP 44.2/8/44.2",
  "STADIP 44.2/16/44.2",
];

const PROFIL_OPTIONS = [
  { value: "acier50", label: "Acier série 50" },
  { value: "acierRPT60", label: "Acier RPT série 60" },
  { value: "alu65", label: "Aluminium RPT série 65" },
];

function ProfilSection({ profil, onChange }) {
  return (
    <div className="vitrage-list">
      {PROFIL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`vitrage-row${profil === opt.value ? " is-on" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="vitrage-row__label">{opt.label}</span>
          {profil === opt.value && (
            <span className="vitrage-row__check">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

function VitrageSection({ vitrage, onChange }) {
  const isCustom = !VITRAGE_PRESETS.includes(vitrage);
  const hasValue = isCustom && vitrage !== "";
  const [draft, setDraft] = useState(hasValue ? vitrage : "");
  const [editing, setEditing] = useState(false);

  const showInput = isCustom && (!hasValue || editing);

  const confirm = () => {
    const v = draft.trim();
    if (!v) return;
    onChange(v);
    setEditing(false);
  };

  return (
    <div className="vitrage-list">
      {VITRAGE_PRESETS.map((p) => (
        <button
          key={p}
          className={`vitrage-row${vitrage === p ? " is-on" : ""}`}
          onClick={() => {
            onChange(p);
            setEditing(false);
          }}
        >
          <span className="vitrage-row__label">{p}</span>
          {vitrage === p && <span className="vitrage-row__check">✓</span>}
        </button>
      ))}
      <button
        className={`vitrage-row${isCustom ? " is-on" : ""}`}
        onClick={() => {
          if (!isCustom) {
            // Bascule vers custom : on garde le draft existant s'il y en a un
            onChange(draft || "");
            setEditing(!draft);
          } else if (hasValue && !editing) {
            setDraft(vitrage);
            setEditing(true);
          }
        }}
      >
        <span className="vitrage-row__label">
          {hasValue ? vitrage : draft ? draft : "Autre…"}
        </span>
        {isCustom && <span className="vitrage-row__check">✓</span>}
      </button>
      {showInput && (
        <div className="vitrage-custom">
          <input
            className="vitrage-input"
            type="text"
            placeholder="Ex: STADIP 55.2…"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirm()}
          />
          <button
            className="vitrage-confirm"
            disabled={!draft.trim()}
            onClick={confirm}
          >
            Valider
          </button>
        </div>
      )}
    </div>
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
function Acc({ num, label, summary, open, onToggle, children }) {
  return (
    <div className="acc">
      <button className="acc__hd" onClick={onToggle}>
        <span className="acc__num">{num}</span>
        <span className="acc__lbl">{label}</span>
        {!open && summary && <span className="acc__summary">{summary}</span>}
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

function NavIcon({ type }) {
  if (type === "chassis")
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="2.5"
          y="2.5"
          width="17"
          height="17"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="5.5"
          y="5.5"
          width="11"
          height="11"
          rx="1.5"
          fill="currentColor"
          opacity="0.15"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    );
  if (type === "pt")
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="5"
          y="2"
          width="12"
          height="18"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="8"
          y="8"
          width="6"
          height="4.5"
          rx="1"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
      </svg>
    );
  if (type === "imposte")
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="2.5"
          y="7"
          width="17"
          height="8"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="8"
          y1="11"
          x2="14"
          y2="11"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect
        x="3.5"
        y="1.5"
        width="15"
        height="19"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="14" cy="11" r="1.4" fill="currentColor" />
    </svg>
  );
}
