import React from "react";
import { ScanLine, ShieldCheck, X, ChevronRight } from "lucide-react";
export const questions = [
  "Why was this flagged?",
  "Show strongest evidence",
  "Is this an official asset?",
  "Why is the publisher suspicious?",
  "What should I investigate next?",
  "What is this connected to?",
];
export const statuses = [
  "New",
  "Investigating",
  "Confirmed",
  "Escalated",
  "Monitoring",
  "Resolved",
  "False Positive",
];
export const label = (f) =>
  f.candidate.username ? "@" + f.candidate.username : f.candidate.name;
export const date = (s) => new Date(s).toLocaleString();
export const emptyBrand = {
  name: "",
  website: "",
  logo: "",
  domains: [],
  socials: [],
  apps: [],
  publishers: [],
  keywords: [],
  variations: [],
};
export const tone = (f) =>
  f.status === "TRUSTED"
    ? "trusted"
    : f.status === "ALLOWLISTED"
      ? "muted"
      : f.severity.toLowerCase().replace(" ", "-");

export function Badge({ children, kind = "" }) {
  return <span className={"badge " + kind}>{children}</span>;
}

export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="empty">
      <ScanLine size={30} />
      <h3>{title}</h3>
      <p>{children || "Run a demo scan or analyze an asset to begin."}</p>
    </div>
  );
}

export function Field({ label: text, children, hint }) {
  return (
    <label className="field">
      <span>{text}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function LogoInput({ value, onChange, onError }) {
  return (
    <div className="logo-input">
      {value ? (
        <img src={value} alt="Registered brand logo" />
      ) : (
        <div className="logo-placeholder">
          <ShieldCheck />
        </div>
      )}
      <div>
        <input
          aria-label="Upload logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 1_000_000) {
              onError("Use an image under 1 MB.");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onChange(reader.result);
            reader.readAsDataURL(file);
          }}
        />
        <small>PNG, JPG or WebP · up to 1 MB · image-hash comparison</small>
        {value && (
          <button
            type="button"
            className="text-button"
            onClick={() => onChange("")}
          >
            Remove logo
          </button>
        )}
      </div>
    </div>
  );
}

export function FindingsTable({ rows, onSelect, compact = false }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Observed asset</th>
            <th>Risk</th>
            <th>Status / severity</th>
            {!compact && (
              <>
                <th>Priority</th>
                <th>Evidence</th>
              </>
            )}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} onClick={() => onSelect(f)}>
              <td>
                <button className="asset-link">{label(f)}</button>
                <small>
                  {f.candidate.channel === "social"
                    ? f.candidate.platform
                    : f.candidate.developer}{" "}
                  <span className="dim">/ {f.source}</span>
                </small>
              </td>
              <td>
                <span className={"risk-number " + tone(f)}>
                  {f.risk}
                  <span>/100</span>
                </span>
              </td>
              <td>
                <Badge kind={tone(f)}>
                  {f.status === "SUSPICIOUS" ? f.severity : f.status}
                </Badge>
              </td>
              {!compact && (
                <>
                  <td>
                    <span className="priority">{f.priority}</span>
                    {f.campaign_id && <small>Connected</small>}
                  </td>
                  <td>
                    {f.signals.filter((s) => s.points > 0).length} signals
                    <small>{f.confidence}% confidence</small>
                  </td>
                </>
              )}
              <td>
                <ChevronRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
