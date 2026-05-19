import ConfigPanel from "./components/panel/ConfigPanel";
import DoorViewer from "./components/viewer/DoorViewer";
import "./App.css";

const DATE = new Date().toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function App() {
  return (
    <div className="app">
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
      <div className="app-body">
        <ConfigPanel />
        <DoorViewer />
      </div>
    </div>
  );
}
