# ROADMAP.md — Plan de développement

## Vue d'ensemble

```
Phase 1 → Ouvrant seul fonctionnel          ✅ TERMINÉE
Phase 2 → Éléments additionnels             ✅ TERMINÉE
Phase 3 → Quincaillerie & UI complète       ✅ TERMINÉE
Phase 4 → Traverses, remplissages, export   🔄 EN COURS
```

**Règle** : valider visuellement chaque phase avant de passer à la suivante.

---

## Phase 1 — Base ✅

**Objectif** : ouvrant seul, parfaitement rendu, avec dimensions variables.

### 1.1 Init projet

- [x] `npm create vite@latest configurateur-porte -- --template react`
- [x] `npm install zustand jspdf`
- [x] Créer la structure des dossiers
- [x] Copier `svgRef.js`, `svgCoords.js`, `paumellesCalc.js`
- [x] Copier `profiles.js`

### 1.2 Store Zustand minimal

- [x] W, H, ouv, ferrage, baton, fermeture, elements

### 1.3 DoorViewer — ouvrant seul

- [x] `DoorViewer.jsx` : SVG avec viewBox dynamique
- [x] `Dormant.jsx` : 4 profils + seuil + contours
- [x] `Ouvrant.jsx` : 3 modes (paumelles, pivot-g, pivot-d) + remplissage
- [x] Ordre de dessin correct
- [x] Test avec W=1000 H=2100

### 1.4 ConfigPanel — contrôles basiques

- [x] Sliders largeur (500–1500) + hauteur (2000–2400)
- [x] Saisie numérique synchronisée avec slider
- [x] Boutons Extérieure/Intérieure, Paumelles/Pivot, Gauche/Droite, Ventouse/Serrure
- [x] Alertes passage libre

---

## Phase 2 — Éléments additionnels ✅

**Objectif** : châssis, PT et imposte ajoutables et réorganisables.

### 2.1 Store — éléments

- [x] `elements[]` ordonné, `addElement`, `removeElement`, `moveElement`
- [x] `reorderElement` pour le drag-and-drop
- [x] `hasImposte`, `impH`
- [x] `selectedId` pour la sélection dans le viewer
- [x] `fill` par élément (vitrage/tôle)
- [x] `updateElementW`, `updateElementFill`

### 2.2 Châssis

- [x] `Chassis.jsx` : profils 70mm, remplissage paramétrable (vitrage/tôle)
- [x] Calcul position X depuis `computeLayout()`
- [x] FillSwitch dans le viewer pour changer vitrage/tôle
- [x] Numérotation dynamique (reset correct si suppression)

### 2.3 Poteau technique

- [x] `PT.jsx` : rectangle vert, hauteur H
- [x] Réservation interphonie en pointillés (145×398, bas à 900mm)

### 2.4 Imposte

- [x] `Imposte.jsx` : profils 70mm, remplissage bleu, couvre TOUS les éléments
- [x] Hauteur paramétrable (slider 100–800mm)
- [x] ViewBox s'agrandit vers le haut

### 2.5 UI — liste éléments ordonnables

- [x] Onglet ÉLÉMENTS avec liste et flèches ← →
- [x] Glisser-déposer depuis le viewer SVG (ligne d'insertion bleue)
- [x] Boutons + Châssis, + Poteau, + Imposte
- [x] Max 1 PT, 1 Imposte
- [x] Bouton ✕ pour supprimer (sauf ouvrant)
- [x] Auto-ouverture de l'accordéon du nouvel élément
- [x] Auto-switch sur l'onglet ÉLÉMENTS à l'ajout

---

## Phase 3 — Quincaillerie & UI complète ✅

**Objectif** : toute la quincaillerie, accordéon complet, design finalisé.

### 3.1 Paumelles

- [x] `Paumelles.jsx` : 4 paumelles, positions calculées depuis `paumellesCalc.js`
- [x] Côté automatique (opposé à la poignée)
- [x] Visibles uniquement en vue ext

### 3.2 Contour pivot

- [x] `Pivot.jsx` : contour système côté opposé à la poignée
- [x] Visible vue ext ET int

### 3.3 Bâton maréchal

- [x] `Baton.jsx` : plats + barre inox + plaque
- [x] Ancré bas à 800mm du sol
- [x] Côté = côté poignée

### 3.4 Bandeau ventouse

- [x] `Ventouse.jsx` : rectangle vert côté poignée
- [x] Visible seulement si fermeture = ventouse ET vue ext

### 3.5 UI accordéon 2 onglets

- [x] Onglet **PORTE** : Dimensions, Configuration, Traverses, Remplissage
- [x] Onglet **ÉLÉMENTS** : liste ordonnée + ajout
- [x] Badge de comptage sur l'onglet Éléments
- [x] Passage libre calculé et affiché

### 3.6 Design Apple HIG

- [x] Police `-apple-system, BlinkMacSystemFont`
- [x] Fond gris `#F2F2F7`, cartes blanches avec ombre
- [x] Tab bar : Apple Segmented Control (pill gris, segment actif blanc)
- [x] Card2 : Apple Segmented Control
- [x] FillSwitch SVG : Apple Segmented Control dans le viewer
- [x] Sliders Apple (thumb blanc avec ombre multicouche)
- [x] Header et footer en verre (backdrop-filter blur)
- [x] Bleu `#007AFF`, Vert `#34C759`, Rouge `#FF3B30`

---

## Phase 4 — Traverses, remplissages, export 🔄

**Objectif** : configuration avancée + descriptif + PDF.

### 4.1 Traverses mobiles

- [x] Traverses H sur ouvrant (max 3 → max 4 zones)
- [x] Anti-collision (min 90mm entre deux traverses)
- [x] Bouton "Égaliser les zones"
- [x] Saisie position Y en mm depuis le bas
- [ ] Traverses H + V sur châssis et imposte

### 4.2 Zones de remplissage

- [x] Génération dynamique des zones selon traverses
- [x] Switch vitrage / tôle par zone (dans le viewer ET dans le panneau)
- [x] FillSwitch Apple Segmented Control dans le viewer SVG
- [ ] Référence zone affichée sur le plan (ex: O1-R2)
- [ ] Vitrage → couleur finale `#b8d8e8`
- [ ] Tôle → couleur RAL sélectionnée

### 4.3 Finition RAL

- [ ] Sélecteur 5 couleurs (+ extensible)
- [ ] Profils et tôles prennent la couleur RAL
- [ ] Inox reste `#C0C0C0` (seuil, rondelles, barre bâton)

### 4.4 Descriptif technique

- [ ] Dimensions et références de chaque élément
- [ ] Type de remplissage par zone
- [ ] Quincaillerie complète
- [ ] Finition RAL

### 4.5 Export PDF

- [ ] Plan 2D SVG → PDF (via jsPDF)
- [ ] Descriptif technique → PDF
- [ ] Format professionnel avec en-tête

---

## Notes importantes

### SVG de référence

Le fichier `PORTE_HALL_V4.svg` est la source de vérité visuelle. En cas de doute, comparer le rendu React avec ce fichier.

### Priorité absolue

1. Les profils fixes NE SE DÉFORMENT JAMAIS
2. L'ordre de dessin est respecté à chaque modification
3. Valider visuellement avant de coder la suite
4. Le design respecte l'Apple HIG à chaque nouvelle UI

### Comportement imposte

L'imposte couvre **tous** les éléments y compris le PT (comportement actuel validé). La spec initiale "sauf PT" a été modifiée suite à décision utilisateur.
