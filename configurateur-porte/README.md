# Configurateur de Porte de Hall

Configurateur 2D paramétrique de porte de hall en React + SVG inline. Permet à un professionnel de composer visuellement une porte, de configurer ses éléments et de générer un descriptif technique.

## Stack

- **React + Vite** — UI
- **Zustand** — état global
- **SVG paramétrique inline** — rendu 2D, pas de canvas
- **jsPDF** — export PDF (à venir)
- **Design Apple HIG** — `-apple-system`, segmented controls, cartes blanches

## Lancer le projet

```bash
npm install
npm run dev
```

## Ce qui est fait

- Ouvrant avec dormant, profils, paumelles/pivot, bâton maréchal, bandeau ventouse
- Châssis et poteau technique (PT) ajoutables, repositionnables par drag-and-drop
- Imposte globale couvrant tous les éléments
- Traverses mobiles horizontales sur l'ouvrant (max 3)
- Zones de remplissage vitrage / tôle par zone
- Interface 2 onglets (Porte / Éléments) avec design Apple HIG

## Ce qui reste à faire

- Traverses sur châssis et imposte
- Finitions RAL
- Descriptif technique auto-généré
- Export PDF

## Documentation

- `../CLAUDE.md` — instructions et architecture
- `../SPECS.md` — spécifications techniques complètes
- `../SVG_COORDS.md` — coordonnées SVG exactes et fonction `t()`
- `../ROADMAP.md` — plan de développement et avancement
