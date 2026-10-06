import React, { useState, useEffect } from "react";
import { X, Network, FolderOpen, Download } from "lucide-react";
import { Badge, Field, label, tone, date } from "./shared.jsx";
export default function FindingDetail({
  finding: f,
  onClose,
  onIncident,
  onFeedback,
  onRemoveFeedback,
  onReport,
  busy,
}) {
  const [reason, setReason] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  useEffect(() => {
    setReason("");
    setFeedbackOpen(false);
  }, [f?.id]);
  useEffect(() => {
    if (!f) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [f, onClose]);
  if (!f) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <section
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Finding evidence"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <span className="eyebrow">FINDING / {f.id.slice(0, 8)}</span>
          <button
            autoFocus
            className="icon-button"
            aria-label="Close finding"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <h2>{label(f)}</h2>
        <p className="dim">
          {f.candidate.channel === "social"
            ? f.candidate.platform
            : f.candidate.developer}{" "}
          · {f.source}
        </p>
        <div className="detail-scores">
          <div>
            <span className={"detail-risk " + tone(f)}>
              {f.risk}
              <small>/100</small>
            </span>
            <span>Potential risk</span>
          </div>
          <div>
            <strong>{f.confidence}%</strong>
            <span title={f.confidence_basis}>Evidence confidence</span>
          </div>
          <Badge kind={tone(f)}>
            {f.status === "SUSPICIOUS" ? f.severity : f.status}
          </Badge>
        </div>
        <div className="classification">
          <Badge>{f.priority}</Badge>
          <strong>{f.threat}</strong>
        </div>
        <p>{f.explanation}</p>
        <h3>Score breakdown</h3>
        <div className="evidence-list">
          {f.signals.map((s) => (
            <div className="evidence" key={s.key}>
              <div>
                <strong>{s.label}</strong>
                <span className={s.points > 0 ? "accent" : ""}>
                  {s.points > 0 ? "+" : ""}
                  {s.points}
                </span>
              </div>
              <p>{s.detail}</p>
            </div>
          ))}
          {!f.signals.length && <p>No qualifying signals.</p>}
          <div className="total">
            <strong>Total risk</strong>
            <b>{f.risk} / 100</b>
          </div>
        </div>
        <div className="two-col detail-facts">
          <div>
            <small>Identity similarity</small>
            <strong>{f.similarity}%</strong>
          </div>
          <div>
            <small>Logo structure</small>
            <strong>
              {f.visual_similarity === null
                ? "Not available"
                : f.visual_similarity + "%"}
            </strong>
          </div>
        </div>
        <details>
          <summary>How confidence is calculated</summary>
          <p>{f.confidence_basis}</p>
        </details>
        <details>
          <summary>Original supplied metadata</summary>
          <dl>
            {Object.entries(f.candidate)
              .filter(
                ([k, v]) => v && !["logo", "brand_id", "channel"].includes(k),
              )
              .map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
          </dl>
          {f.candidate.logo && (
            <img
              className="evidence-logo"
              src={f.candidate.logo}
              alt="Candidate logo"
            />
          )}
        </details>
        <h3>Recommended investigation</h3>
        <p>{f.action}</p>
        {f.campaign_id && (
          <div className="notice">
            <Network size={18} />
            <p>
              Shared suspicious domain connects this finding to a possible
              campaign. Review related assets together.
            </p>
          </div>
        )}
        <small>
          Detected {date(f.created_at)}
          <br />
          Last analyzed {date(f.updated_at)}
        </small>
        <div className="button-row">
          <button
            className="primary"
            disabled={busy}
            onClick={() => onIncident(f.id)}
          >
            <FolderOpen size={16} /> Create incident
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => onReport(f.id)}
          >
            <Download size={16} /> Generate report
          </button>
        </div>
        {f.status === "ALLOWLISTED" ? (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => onRemoveFeedback(f.id)}
          >
            Remove allowlist and recalculate
          </button>
        ) : (
          f.status !== "TRUSTED" && (
            <button
              className="text-button"
              onClick={() => setFeedbackOpen(!feedbackOpen)}
            >
              Mark as false positive / allowlist
            </button>
          )
        )}
        {feedbackOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onFeedback(f.id, reason);
            }}
          >
            <Field label="Why is this a false positive?">
              <textarea
                required
                minLength={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Record the verification behind your decision."
              />
            </Field>
            <button className="secondary" disabled={busy}>
              Save analyst decision
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
