# CLAUDE.md — Configurateur de Porte de Hall

## Rôle

Tu es l'assistant de développement d'un configurateur 2D de porte de hall en React. Ce projet permet à un professionnel de composer visuellement une porte de hall, de configurer ses éléments, et de générer un descriptif technique.

---

## Stack technique

- **React + Vite**
- **Zustand** — état global
- **jsPDF** — export PDF (à implémenter)
- **SVG paramétrique inline** — pas de canvas, pas de lib de dessin
- Pas de 3D — uniquement vue de face 2D
- **Design system Apple HIG** — `-apple-system` font, couleurs système iOS

---

## Règles absolues — NE JAMAIS VIOLER

### SVG

1. **Ne jamais scaler les profils** — montants et traverses ont des dimensions fixes en mm. Seules les zones intérieures s'étirent.
2. **Utiliser les coordonnées exactes** du fichier `SVG_COORDS.md` — ne pas recalculer ni approximer.
3. **Ordre de dessin respecté** (voir `SPECS.md` section Layers) — l'ouvrant est toujours devant le dormant en vue extérieure.
4. **Transformation par ancrage** uniquement — chaque élément SVG a un ancre (gauche/droite, haut/bas) et éventuellement un étirement. Voir la fonction `t()` dans `SVG_COORDS.md`.
5. **Repère SVG** : l'origine du dormant est à `(RX=3500, RY=2000)` dans le repère SVG. Tous les éléments additionnels (châssis, PT) sont positionnés par coordonnées absolues depuis ce repère.

### Profils fixes (ne jamais déformer)

| Élément                | Dimension fixe |
| ---------------------- | -------------- |
| Montants dormant       | 70mm           |
| Traverse haute dormant | 70mm           |
| Seuil inox             | 10mm           |
| Montants châssis       | 70mm           |
| Traverses châssis      | 70mm           |
| Montants ouvrant ext   | 90mm           |
| Traverses ouvrant ext  | 90mm           |
| Montants imposte       | 70mm           |
| Traverses imposte      | 70mm           |
| Traverses mobiles      | 90mm           |

### Code

- **Un composant par élément** — `Dormant`, `Ouvrant`, `Chassis`, `PT`, `Imposte`
- **Zustand** pour tout l'état global — pas de prop drilling
- **Aucun inline style** sauf pour les attributs SVG natifs
- **Tester visuellement** chaque élément avant de passer au suivant
- **Commiter** après chaque phase validée

### Design

- Police système Apple : `-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`
- Fond gris iOS : `#F2F2F7` pour le panneau
- Cartes blanches : `#FFFFFF` sur fond gris pour les sections
- Bleu système : `#007AFF` pour les accents et actions
- Vert système : `#34C759` pour la tôle
- Rouge système : `#FF3B30` pour les actions destructives
- Segmented control Apple pour les choix binaires (tabs, Card2, FillSwitch)

---

## Structure des dossiers (état actuel)

```
configurateur-porte/
  src/
    components/
      viewer/
        DoorViewer.jsx       ← SVG principal + FillSwitch + drag-and-drop
        DoorViewer.css
        Dormant.jsx
        Ouvrant.jsx
        Chassis.jsx
        PT.jsx
        Imposte.jsx
        Paumelles.jsx
        Pivot.jsx
        Baton.jsx
        Ventouse.jsx
      panel/
        ConfigPanel.jsx      ← panneau gauche complet (2 onglets : Porte / Éléments)
        ConfigPanel.css
    store/
      useDoorStore.js        ← Zustand store (état complet)
    utils/
      svgCoords.js           ← fonction t() et constantes SVG
      paumellesCalc.js       ← calcul positions paumelles
    constants/
      profiles.js            ← profils fixes
      svgRef.js              ← RX, RY, RW, RH
    App.jsx
    App.css
    index.css
```

---

## État actuel du développement

### ✅ Phase 1 — Base (TERMINÉE)

- DoorViewer, Dormant, Ouvrant, sliders W/H fonctionnels

### ✅ Phase 2 — Éléments additionnels (TERMINÉE)

- Châssis (glisser-déposer depuis le viewer + flèches ← → du panel)
- Poteau technique (PT) avec réservation interphonie
- Imposte globale couvrant TOUS les éléments y compris le PT
- Numérotation dynamique des châssis (reset si suppression)
- `fill` (vitrage/tôle) par châssis

### ✅ Phase 3 — Quincaillerie & UI (TERMINÉE)

- Paumelles (4 positions calculées), Pivot (contour)
- Bâton maréchal, Bandeau ventouse
- Interface à 2 onglets : **PORTE** (Dimensions, Configuration, Traverses, Remplissage) et **ÉLÉMENTS**
- FillSwitch Apple Segmented Control dans le viewer SVG
- Redesign complet Apple HIG

### 🔄 Phase 4 — Finitions (EN COURS)

- ✅ Traverses H sur ouvrant (max 3 → max 4 zones)
- ✅ Zones de remplissage vitrage/tôle avec switch dans le viewer
- ✅ Bouton "Égaliser les zones"
- ❌ Traverses sur châssis et imposte
- ❌ Finitions RAL
- ❌ Descriptif technique auto-généré
- ❌ Export PDF

---

## Commandes

```bash
cd configurateur-porte
npm run dev      # dev server
npm run build    # build production
```

---

## Validation à chaque étape

Avant de passer à l'étape suivante, vérifier :

- [ ] Les profils fixes ne sont pas déformés
- [ ] Le rendu correspond visuellement au SVG de référence
- [ ] Les dimensions W et H variables fonctionnent correctement
- [ ] Aucune zone blanche non voulue dans l'assemblage
- [ ] Le design respecte l'Apple HIG (segmented controls, cartes blanches sur gris)
