import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ShieldCheck,
  LayoutDashboard,
  Fingerprint,
  Users,
  AppWindow,
  ScanLine,
  Network,
  FolderOpen,
  MessageSquare,
  Workflow,
  ChevronRight,
  Play,
  X,
  Check,
  AlertCircle,
  Menu,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import { api } from "./api";
import { Badge, Empty } from "./components/shared";
import "./styles.css";
import Dashboard from "./pages/Dashboard.jsx";
import BrandEditor from "./pages/BrandEditor.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import Analyze from "./pages/Analyze.jsx";
import ThreatGraph from "./pages/ThreatGraph.jsx";
import Incidents from "./pages/Incidents.jsx";
import Copilot from "./pages/Copilot.jsx";
import Architecture from "./pages/Architecture.jsx";
import FindingDetail from "./components/FindingDetail.jsx";
import Report from "./components/Report.jsx";
const pages = [
  ["Dashboard", LayoutDashboard],
  ["Trusted Digital Twin", Fingerprint],
  ["Social Monitoring", Users],
  ["App Monitoring", AppWindow],
  ["Analyze Asset", ScanLine],
  ["Threat Graph", Network],
  ["Incidents", FolderOpen],
  ["Investigation Copilot", MessageSquare],
  ["System / Architecture", Workflow],
];
function App() {
  const initial = decodeURIComponent(location.hash.slice(1));
  const [page, setPage] = useState(
    pages.some(([p]) => p === initial) ? initial : "Dashboard",
  );
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [creating, setCreating] = useState(false);
  const [findings, setFindings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [graph, setGraph] = useState(null);
  const [config, setConfig] = useState(null);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobile, setMobile] = useState(false);
  const refreshSequence = useRef(0);
  const brand = brands.find((b) => b.id === brandId);
  function navigate(p) {
    setPage(p);
    location.hash = encodeURIComponent(p);
    setMobile(false);
  }
  useEffect(() => {
    const handler = () => {
      const p = decodeURIComponent(location.hash.slice(1));
      if (pages.some(([x]) => x === p)) setPage(p);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const [bs, c] = await Promise.all([api("/brands"), api("/config")]);
      setBrands(bs);
      setConfig(c);
      setBrandId((id) => (bs.some((b) => b.id === id) ? id : bs[0]?.id || ""));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function refresh(id = brandId) {
    if (!id) return;
    const sequence = ++refreshSequence.current;
    const q = "?brand_id=" + encodeURIComponent(id);
    const [f, c, d, i, g] = await Promise.all([
      api("/findings" + q),
      api("/campaigns" + q),
      api("/dashboard" + q),
      api("/incidents" + q),
      api("/graph" + q),
    ]);
    if (sequence !== refreshSequence.current) return;
    setFindings(f);
    setGroups(c);
    setDashboard(d);
    setIncidents(i);
    setGraph(g);
    setSelected((s) => (s ? f.find((x) => x.id === s.id) || s : null));
  }
  useEffect(() => {
    bootstrap();
  }, []);
  useEffect(() => {
    setSelected(null);
    setFindings([]);
    setDashboard(null);
    setGroups([]);
    setIncidents([]);
    setGraph(null);
    setReport(null);
    if (brandId) refresh(brandId).catch((e) => setError(e.message));
  }, [brandId]);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 6500);
    return () => clearTimeout(timer);
  }, [success]);
  async function act(action, message) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      await refresh();
      if (message) setSuccess(message);
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveBrand(form) {
    setBusy(true);
    setError("");
    try {
      const saved = await api(creating ? "/brands" : "/brands/" + brandId, {
        method: creating ? "POST" : "PUT",
        body: form,
      });
      const bs = await api("/brands");
      setBrands(bs);
      setBrandId(saved.id);
      setCreating(false);
      await refresh(saved.id);
      setSuccess("Trusted identity saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const scan = () =>
    act(
      () => api("/demo/scan", { method: "POST", body: { brand_id: brandId } }),
      "Demo scan complete. Findings and campaign relationships updated.",
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a
          className="wordmark"
          href="#Dashboard"
          onClick={() => navigate("Dashboard")}
        >
          <span className="brand-icon">
            <ShieldCheck size={25} />
          </span>
          <span>
            BrandShield <b>AI</b>
            <small>ANALYST WORKSPACE</small>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <select
          className="brand-select"
          aria-label="Active brand"
          value={brandId}
          disabled={busy}
          onChange={(e) => {
            setBrandId(e.target.value);
            setCreating(false);
          }}
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <nav>
          {pages.map(([p, Icon], i) => (
            <React.Fragment key={p}>
              {i === 4 && <div className="nav-divider">INVESTIGATION</div>}
              {i === 8 && <div className="nav-divider">PROJECT</div>}
              <button
                className={page === p ? "active" : ""}
                onClick={() => navigate(p)}
              >
                <Icon size={17} />
                {p}
                {p === "Dashboard" && <span className="nav-dot" />}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="dot" />
          <div>
            <strong>Local demo environment</strong>
            <small>No external API required</small>
          </div>
          <span className="version">v1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{brand?.name || "BrandShield AI"}</strong>
          </div>
          <div className="header-right">
            <Badge>DEMO DATA</Badge>
            <span className="analyst-avatar">AN</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                EXPLAINABLE DIGITAL RISK PROTECTION
              </span>
              <h1>{page}</h1>
              <p>
                {page === "Dashboard"
                  ? "A clear view of what is yours, what is suspicious, and what to investigate next."
                  : page === "Social Monitoring"
                    ? "Review profile identities, look-alike handles and linked-domain evidence."
                    : page === "App Monitoring"
                      ? "Compare app identities, publishers and branding against the trusted registry."
                      : page === "Trusted Digital Twin"
                        ? "The verified baseline for every detection."
                        : page === "Threat Graph"
                          ? "Follow the evidence across social and app impersonation."
                          : "Evidence-led decisions, from detection to response."}
              </p>
            </div>
            <button
              className="primary scan-button"
              disabled={busy || !brand}
              onClick={scan}
            >
              <Play size={15} />
              {busy ? "Working…" : "Run demo scan"}
            </button>
          </div>
          {error && (
            <div role="alert" className="alert error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="text-button"
                onClick={() => {
                  bootstrap();
                  if (brandId) refresh().catch((e) => setError(e.message));
                }}
              >
                Retry
              </button>
              <button className="icon-button" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {success && (
            <div role="status" className="alert success">
              <Check size={18} />
              {success}
            </div>
          )}
          {loading ? (
            <Empty title="Opening analyst workspace…" />
          ) : !brand ? (
            <section className="panel">
              <Empty title="Workspace unavailable">
                Start the local API and choose Retry.
              </Empty>
            </section>
          ) : (
            <>
              {page === "Dashboard" && (
                <Dashboard
                  dashboard={dashboard}
                  findings={findings}
                  groups={groups}
                  onSelect={setSelected}
                  navigate={navigate}
                  scan={scan}
                  busy={busy}
                />
              )}{" "}
              {page === "Trusted Digital Twin" && (
                <BrandEditor
                  key={creating ? "new" : brand.id}
                  brand={creating ? null : brand}
                  onSave={saveBrand}
                  busy={busy}
                  onError={setError}
                  onNew={() => setCreating(true)}
                />
              )}{" "}
              {(page === "Social Monitoring" || page === "App Monitoring") && (
                <Monitoring
                  key={page}
                  channel={page === "Social Monitoring" ? "social" : "app"}
                  findings={findings}
                  onSelect={setSelected}
                />
              )}{" "}
              {page === "Analyze Asset" && (
                <Analyze
                  key={brandId}
                  brand={brand}
                  busy={busy}
                  onError={setError}
                  onAnalyze={async (c) => {
                    const f = await act(() =>
                      api("/analyze/" + c.channel, { method: "POST", body: c }),
                    );
                    if (f) setSelected(f);
                  }}
                />
              )}{" "}
              {page === "Threat Graph" && (
                <ThreatGraph
                  graph={graph}
                  findings={findings}
                  onSelect={setSelected}
                />
              )}{" "}
              {page === "Incidents" && (
                <Incidents
                  incidents={incidents}
                  busy={busy}
                  onSelect={setSelected}
                  onUpdate={(id, payload) =>
                    act(
                      () =>
                        api("/incidents/" + id, {
                          method: "PATCH",
                          body: payload,
                        }),
                      "Incident saved. Original evidence and action history retained.",
                    )
                  }
                />
              )}{" "}
              {page === "Investigation Copilot" && (
                <Copilot
                  key={brandId}
                  findings={findings}
                  onError={setError}
                  onSelect={setSelected}
                />
              )}{" "}
              {page === "System / Architecture" && (
                <Architecture config={config} />
              )}
            </>
          )}
          <footer>
            <span>BrandShield AI</span>
            <span>Define → Detect → Explain → Investigate</span>
            <span>Metadata-based triage · human review required</span>
          </footer>
        </main>
      </div>
      <FindingDetail
        finding={selected}
        onClose={() => setSelected(null)}
        busy={busy}
        onIncident={(id) =>
          act(
            () =>
              api("/incidents", { method: "POST", body: { finding_id: id } }),
            "Incident saved. Open Incidents to track your investigation.",
          )
        }
        onFeedback={(id, reason) =>
          act(
            () =>
              api("/findings/" + id + "/false-positive", {
                method: "POST",
                body: { reason },
              }),
            "False-positive decision saved for this exact asset.",
          )
        }
        onRemoveFeedback={(id) =>
          act(
            () =>
              api("/findings/" + id + "/false-positive", { method: "DELETE" }),
            "Allowlist removed and evidence recalculated.",
          )
        }
        onReport={(id) =>
          act(async () => {
            const r = await api("/reports/" + id);
            setReport(r);
          })
        }
      />
      <Report report={report} onClose={() => setReport(null)} />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal">
        <h1>Unable to render this view.</h1>
        <p>
          Your saved findings remain in SQLite. Reload the workspace to retry.
        </p>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
