import React from "react";
import { Workflow } from "lucide-react";
import { Badge } from "../components/shared.jsx";
export default function Architecture({ config }) {
  return (
    <>
      <div className="identity-strip">
        <Workflow size={30} />
        <div>
          <h2>One local pipeline. Inspectable decisions.</h2>
          <p>
            React interface · FastAPI · RapidFuzz + Pillow · SQLite · no
            external AI dependency
          </p>
        </div>
      </div>
      <div className="architecture">
        <div className="arch-card">
          <b>01 / Define</b>
          <h3>Trusted Digital Twin</h3>
          <p>Official accounts, app IDs, publishers, domains and logo.</p>
        </div>
        <div className="arch-card">
          <b>02 / Observe</b>
          <h3>Candidate metadata</h3>
          <p>Local demo feed or analyst input. Original text is retained.</p>
        </div>
        <div className="arch-card trusted">
          <b>03 / Verify</b>
          <h3>Exact official exclusion</h3>
          <p>Registered identity → trusted, risk 0. Otherwise continue.</p>
        </div>
        <div className="arch-card">
          <b>04 / Compare</b>
          <h3>Social + app detection</h3>
          <p>
            Look-alike normalization, name similarity, publisher checks, image
            hash and linked domain.
          </p>
        </div>
        <div className="arch-card">
          <b>05 / Explain</b>
          <h3>Central risk engine</h3>
          <p>
            Evidence contributions, single-signal cap, confidence, threat type
            and priority.
          </p>
        </div>
        <div className="arch-card">
          <b>06 / Connect</b>
          <h3>Correlation + SQLite</h3>
          <p>
            Shared suspicious hostnames connect findings. Records and analyst
            feedback persist.
          </p>
        </div>
        <div className="arch-card arch-wide">
          <b>07 / Investigate and respond</b>
          <h3>
            Dashboard → Threat graph → Evidence assistant → Incidents → Report
          </h3>
          <p>
            Human review remains necessary. Reports are prepared locally; no
            automatic takedowns.
          </p>
        </div>
      </div>
      <div className="form-grid">
        <section className="panel form-panel">
          <h2>Scoring contract</h2>
          {Object.entries(config?.weights || {}).map(([s, w]) => (
            <div className="definition-row" key={s}>
              <span>{s.replace("_", " ")}</span>
              <b>up to +{w}</b>
            </div>
          ))}
          <p>
            Evidence contributions sum to a score capped at 100. A single signal
            is capped at 19. Unrelated metadata does not earn keyword, publisher
            or domain penalties.
          </p>
          <p>
            Confidence = 60% metadata coverage + 40% strength-weighted signal
            support (up to four signals). Exact registry and allowlist matches
            show 100% match confidence, not independent proof of identity.
          </p>
        </section>
        <section className="panel form-panel">
          <h2>Source health</h2>
          {config?.sources.map((s) => (
            <div className="source-row" key={s.name}>
              <strong>{s.name}</strong>
              <Badge kind={s.status === "Available" ? "trusted" : "muted"}>
                {s.status}
              </Badge>
              {s.message && <small>{s.message}</small>}
            </div>
          ))}
          <h3>Prototype boundaries</h3>
          <p>
            No live crawling, no platform authentication, no calibrated
            machine-learning probabilities. Logo comparison is a coarse
            structural heuristic. Analyst-entered metadata is not independently
            verified.
          </p>
          <p>
            Local, single-analyst demo. Bind the server to 127.0.0.1;
            authentication and multi-user access are future work.
          </p>
        </section>
      </div>
    </>
  );
}
