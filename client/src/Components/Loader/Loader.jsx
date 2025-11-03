import "./Loader.css";

/**
 * Loader - full-screen branded loader with animated rings
 * Props:
 *  - message?: string (optional status message under the brand)
 */
export default function Loader({ message = "Loading EvangadiForum…" }) {
  return (
    <div className="ef-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="ef-spinner" aria-hidden="true">
        <span className="ef-ring r1" />
        <span className="ef-ring r2" />
        <span className="ef-ring r3" />
        <span className="ef-dot" />
      </div>
      <div className="ef-text">
        <div className="brand" aria-label="EvangadiForum brand">EvangadiForum</div>
        <div className="message">{message}</div>
      </div>
    </div>
  );
}
