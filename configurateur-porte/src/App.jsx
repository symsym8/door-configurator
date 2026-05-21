import { useState, useEffect } from "react";
import ConfigPanel from "./components/panel/ConfigPanel";
import DoorViewer from "./components/viewer/DoorViewer";
import useDoorStore from "./store/useDoorStore";
import "./App.css";

const DATE = new Date().toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function App() {
  const rawIsStartScreen = useDoorStore((s) => {
    const nonOuv = s.elements.filter((e) => e.type !== "ouvrant");
    return !s.hasOuvrant && nonOuv.length === 0 && s.impostes.length === 0;
  });

  // Une fois qu'on a quitté l'écran de démarrage, on n'y revient plus jamais
  const [hasEverStarted, setHasEverStarted] = useState(false);
  useEffect(() => {
    if (!rawIsStartScreen) setHasEverStarted(true);
  }, [rawIsStartScreen]);

  const isStartScreen = rawIsStartScreen && !hasEverStarted;

  return (
    <div className="app">
      {!isStartScreen && (
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo-icon" />
            <div className="header-titles">
              <span className="header-title">CONFIGURATEUR</span>
              <span className="header-sub">PORTE DE HALL</span>
            </div>
          </div>
          <span className="header-date">{DATE}</span>
        </header>
      )}
      <div className="app-body">
        {!isStartScreen && <ConfigPanel />}
        <DoorViewer />
      </div>
    </div>
  );
}
