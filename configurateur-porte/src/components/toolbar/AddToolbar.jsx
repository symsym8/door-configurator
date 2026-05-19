import useDoorStore from "../../store/useDoorStore";
import "./AddToolbar.css";

export default function AddToolbar() {
  const elements = useDoorStore((s) => s.elements);
  const hasImposte = useDoorStore((s) => s.hasImposte);
  const addElement = useDoorStore((s) => s.addElement);
  const toggleImposte = useDoorStore((s) => s.toggleImposte);

  const hasPT = elements.some((e) => e.type === "pt");

  return (
    <aside className="add-toolbar">
      <button
        className="add-toolbar__btn"
        onClick={() => addElement("chassis")}
        title="Ajouter un châssis"
      >
        <span className="add-toolbar__icon">⊞</span>
        <span className="add-toolbar__label">Châssis</span>
      </button>

      <div className="add-toolbar__sep" />

      <button
        className="add-toolbar__btn"
        disabled={hasPT}
        onClick={() => addElement("pt")}
        title="Ajouter un poteau technique"
      >
        <span className="add-toolbar__icon">▌</span>
        <span className="add-toolbar__label">Poteau</span>
      </button>

      <div className="add-toolbar__sep" />

      <button
        className="add-toolbar__btn"
        disabled={hasImposte}
        onClick={toggleImposte}
        title="Ajouter une imposte"
      >
        <span className="add-toolbar__icon">⊟</span>
        <span className="add-toolbar__label">Imposte</span>
      </button>
    </aside>
  );
}
