import React, { useState } from "react";
import {
  Badge,
  Empty,
  Field,
  label,
  date,
  tone,
  statuses,
} from "../components/shared.jsx";
export default function Incidents({ incidents, onUpdate, busy, onSelect }) {
  const [draft, setDraft] = useState({});
  if (!incidents.length)
    return (
      <section className="panel">
        <Empty title="No incidents opened">
          Open a finding and choose “Create incident” to preserve its evidence.
        </Empty>
      </section>
    );
  return (
    <div className="incident-list">
      {incidents.map((i) => {
        const state = draft[i.id] || { status: i.status, notes: i.notes };
        return (
          <section className="panel form-panel" key={i.id}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">INCIDENT · {i.id.slice(0, 8)}</span>
                <h2>{label(i.snapshot)}</h2>
              </div>
              <Badge kind={tone(i.snapshot)}>
                {i.snapshot.risk}/100 at creation
              </Badge>
            </div>
            <small>
              Opened {date(i.created_at)} · Updated {date(i.updated_at)}
            </small>
            <div className="two-col">
              <Field label="Status">
                <select
                  value={state.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [i.id]: { ...state, status: e.target.value },
                    })
                  }
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Analyst notes">
                <textarea
                  value={state.notes}
                  maxLength={10000}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [i.id]: { ...state, notes: e.target.value },
                    })
                  }
                  placeholder="Record your evidence and decision."
                />
              </Field>
            </div>
            <div className="button-row">
              <button
                className="primary"
                disabled={busy}
                onClick={() => onUpdate(i.id, state)}
              >
                Save incident
              </button>
              <button
                className="secondary"
                onClick={() => onSelect(i.snapshot)}
              >
                Original evidence
              </button>
            </div>
            <details>
              <summary>Analyst action history ({i.actions.length})</summary>
              {i.actions.map((a, j) => (
                <div className="audit-row" key={j}>
                  {date(a.time)} — {a.action}
                  {a.notes && <p>{a.notes}</p>}
                </div>
              ))}
            </details>
            <small>
              False Positive saves an allowlist decision. Changing status later
              does not remove that decision; use “Remove allowlist” on the
              current finding.
            </small>
          </section>
        );
      })}
    </div>
  );
}
