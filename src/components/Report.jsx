import React from "react";
import { label, date } from "./shared.jsx";
export default function Report({ report: r, onClose }) {
  if (!r) return null;
  return (
    <div className="report-modal">
      <div className="report-tools">
        <button className="primary" onClick={() => window.print()}>
          Print / save PDF
        </button>
        <button className="secondary" onClick={onClose}>
          Close report
        </button>
      </div>
      <article className="print-report">
        <span>BRANDSHIELD AI / EVIDENCE REPORT</span>
        <h1>{r.brand}</h1>
        <h2>{label(r.finding)}</h2>
        <p>
          {r.finding.threat} · Risk {r.finding.risk}/100 · {r.finding.severity}{" "}
          · {r.finding.priority}
        </p>
        <p>
          Source: {r.finding.source}
          <br />
          Detected: {date(r.finding.created_at)}
          <br />
          Generated: {date(r.generated_at)}
        </p>
        <h3>Assessment</h3>
        <p>{r.finding.explanation}</p>
        <table>
          <thead>
            <tr>
              <th>Evidence</th>
              <th>Contribution</th>
            </tr>
          </thead>
          <tbody>
            {r.finding.signals.map((s) => (
              <tr key={s.key}>
                <td>
                  <b>{s.label}</b>
                  <p>{s.detail}</p>
                </td>
                <td>{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <b>Total: {r.finding.risk}/100</b>
        </p>
        <h3>Related activity</h3>
        <p>{r.campaign?.evidence || "No evidenced campaign connection."}</p>
        {r.campaign && (
          <p>Related finding IDs: {r.campaign.finding_ids.join(", ")}</p>
        )}
        <h3>Recommended response</h3>
        <p>{r.finding.action}</p>
        <h3>Analyst workflow</h3>
        {r.incidents.length ? (
          r.incidents.map((i) => (
            <p key={i.id}>
              {i.status} — {i.notes || "No notes recorded."}
            </p>
          ))
        ) : (
          <p>No incident opened.</p>
        )}
        <h3>Metadata</h3>
        <pre>
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(r.finding.candidate).filter(([k]) => k !== "logo"),
            ),
            null,
            2,
          )}
        </pre>
        <p>{r.disclaimer}</p>
      </article>
    </div>
  );
}
