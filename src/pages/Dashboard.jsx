import React from "react";
import {
  Users,
  AppWindow,
  AlertCircle,
  ScanLine,
  Network,
  Play,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import {
  Badge,
  Empty,
  FindingsTable,
  label,
  date,
  tone,
} from "../components/shared.jsx";
export default function Dashboard({
  dashboard: d,
  findings,
  groups,
  onSelect,
  navigate,
  scan,
  busy,
}) {
  if (!d) return <Empty title="Loading workspace…" />;
  const stats = [
    ["Social assets", d.social, Users],
    ["Mobile apps", d.apps, AppWindow],
    ["Suspicious findings", d.suspicious, AlertCircle],
    ["Critical findings", d.critical, ScanLine],
    ["Possible campaigns", d.campaigns, Network],
  ];
  return (
    <>
      <div className="overview-banner">
        <div>
          <span className="eyebrow">BRAND PROTECTION OVERVIEW</span>
          <h2>
            {d.suspicious
              ? `${d.suspicious} assets need a closer look.`
              : "Your trusted identity is the starting point."}
          </h2>
          <p>
            {d.social + d.apps
              ? `${d.trusted} registered official assets excluded. Findings below use stored, explainable evidence.`
              : "Compare observed profiles and apps with the identity you know is legitimate."}
          </p>
        </div>
        <div className="source-label">
          <span className="dot" /> LOCAL ANALYSIS
          <small>Demo sources · deterministic engine</small>
        </div>
      </div>
      <div className="stats">
        {stats.map(([title, value, Icon]) => (
          <div className="stat" key={title}>
            <span>
              {title}
              <Icon size={15} />
            </span>
            <strong>{value.toString().padStart(2, "0")}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel investigate">
          <div className="panel-heading">
            <div>
              <span className="eyebrow accent">ANALYST QUEUE</span>
              <h2>Investigate first</h2>
            </div>
            <Badge>Ranked by priority</Badge>
          </div>
          {d.priorities.length ? (
            d.priorities.map((f, index) => (
              <button
                className="queue-row"
                key={f.id}
                onClick={() => onSelect(f)}
              >
                <span className="queue-index">0{index + 1}</span>
                <div className="queue-name">
                  <strong>{label(f)}</strong>
                  <small>{f.threat}</small>
                </div>
                <Badge kind={tone(f)}>
                  {f.priority} · {f.risk}
                </Badge>
                <ArrowUpRight size={17} />
              </button>
            ))
          ) : (
            <Empty title="Ready for the first scan">
              <button className="primary" onClick={scan} disabled={busy}>
                <Play size={14} /> Run demo scan
              </button>
            </Empty>
          )}
          <div className="panel-foot">
            Priority considers risk, credential lures and shared infrastructure.
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Threat distribution</h2>
            <span className="dim">Suspicious only</span>
          </div>
          <div className="distribution">
            {Object.entries(d.severity)
              .reverse()
              .map(([s, n]) => (
                <div className="bar-row" key={s}>
                  <span>
                    <i className={"severity-dot " + s.toLowerCase()} />
                    {s}
                  </span>
                  <div className="bar-track">
                    <div
                      className={s.toLowerCase()}
                      style={{
                        width: `${d.suspicious ? (n / d.suspicious) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <b>{n}</b>
                </div>
              ))}
          </div>
          <div className="split-count">
            <div>
              <Users size={17} />
              <strong>
                {
                  findings.filter(
                    (f) =>
                      f.status === "SUSPICIOUS" &&
                      f.candidate.channel === "social",
                  ).length
                }
              </strong>
              <small>Social findings</small>
            </div>
            <div>
              <AppWindow size={17} />
              <strong>
                {
                  findings.filter(
                    (f) =>
                      f.status === "SUSPICIOUS" &&
                      f.candidate.channel === "app",
                  ).length
                }
              </strong>
              <small>App findings</small>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Recent findings</h2>
            <button
              className="text-button"
              onClick={() => navigate("Social Monitoring")}
            >
              Open monitoring <ChevronRight size={14} />
            </button>
          </div>
          <FindingsTable rows={d.recent} onSelect={onSelect} compact />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Connected activity</h2>
            <Network size={18} />
          </div>
          {groups.length ? (
            groups.slice(0, 3).map((c) => (
              <button
                className="campaign-card"
                key={c.id}
                onClick={() => navigate("Threat Graph")}
              >
                <span className="eyebrow">POSSIBLE CAMPAIGN</span>
                <strong>{c.domain}</strong>
                <span>
                  {c.finding_ids.length} linked assets{" "}
                  <ArrowUpRight size={14} />
                </span>
              </button>
            ))
          ) : (
            <p className="panel-copy">
              No shared suspicious domains found yet. Relationships require
              matching evidence.
            </p>
          )}
        </section>
      </div>
      <section className="panel activity">
        <div className="panel-heading">
          <h2>Workspace activity</h2>
          <span className="dim">Recorded actions</span>
        </div>
        {d.activity.map((a) => (
          <div className="activity-row" key={a.id}>
            <span className="dot" />
            <span>{a.message}</span>
            <time>{date(a.time)}</time>
          </div>
        ))}
      </section>
    </>
  );
}
