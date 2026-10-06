# BrandShield AI — engineering handoff

## Implemented

- React/Vite analyst interface with all nine navigation views, responsive CSS, loading/empty/error states, and a centralized API client.
- FastAPI with validated brand registration/editing, social/app analysis, scans, findings, campaigns, graph, dashboard, incidents, feedback, reports, copilot and health endpoints.
- Trusted Digital Twin with image upload, registered domains, platform-scoped handles, app/store identifiers, developers, variations and keywords.
- Exact official social and app exclusion: TRUSTED, risk 0. Unknown apps are not trusted solely because their developer string matches.
- RapidFuzz look-alike comparison and a limited explicit confusable-character mapping.
- Real Pillow average-hash logo comparison, with missing/invalid-image handling and documented limits.
- Centralized deterministic risk weights, independent-signal control, visible score adjustments, separate confidence formula, and investigation priority.
- Idempotent scans, SQLite persistence, analyst allowlisting, and incident snapshots/action history.
- Correlation backed by exact shared suspicious hostnames; clickable React Flow graph.
- Evidence-template assistant; printable report view with original metadata, score contributions, related finding IDs and incident notes.
- README architecture diagram, in-app architecture/source-health page, setup instructions and a timed demonstration script.

## Demo / simulated

The first-run Northstar identity and shield logo are fictional. The default scan uses 26 seeded social/app records with fixture publishers, descriptions, copied logos and reserved `.example` domains. Inputs are labeled Demo dataset. Manual analysis is labeled Manual metadata.

The records are simulated; string comparison, visual hashes, scores, database writes, evidence explanations, campaign relationships and incident changes are computed by the running implementation. Dashboard counts are derived from stored findings.

## Not implemented / roadmap

Live social/app crawling, source authentication, domain intelligence, ownership validation, production authentication, multi-tenant authorization, automatic takedowns, a trained model, generative LLM narration, calibrated accuracy metrics, and evidence signing are not implemented. No feature claims to perform them.

## Tests actually executed

Environment: Linux, Python 3.12, Node.js 24.19.0. Dependencies were installed using pip and npm; exact Python versions and the frontend lockfile are included.

| Command / check | Result |
| --- | --- |
| `.venv/bin/python -m pytest backend/tests -q` | **29 passed** |
| `npm --prefix frontend run build` | **Passed**; Vite production build |
| `.venv/bin/python scripts/verify.py` | **Passed** complete verification sequence |
| Actual `GET /api/health` over localhost HTTP | **Passed**, SQLite healthy |
| Built frontend served from FastAPI root | **Passed** |
| React DOM test against a real running API | **Passed**, all nine pages |
| Official social + app examples in the UI | **Passed**, both risk 0 |
| Suspicious app evidence + publisher mismatch | **Passed** |
| Incident creation/status/notes + report rendering | **Passed** |
| Evidence-assistant response | **Passed** |
| Graph asset click opens evidence detail | **Passed** in DOM; geometry not assessed |
| Brand registration through the interface | **Passed** |
| Uvicorn process stop/start and incident comparison | **Passed**, identical persisted incidents; 26 demo findings retained |
| DOM runtime error capture | **No errors** |

The backend test suite also covers determinism, score/contribution bounds, official platform/identifier boundaries, exact domain boundaries, missing evidence, malformed inputs, duplicate trusted identities, unrelated assets, campaign evidence, false-positive persistence, incident snapshots and brand-edit recalculation.

One dependency warning remains: Starlette's TestClient warns that its httpx integration is deprecated. It did not fail the tests and does not affect the application runtime. npm emitted an environment-specific `http-proxy` configuration warning. Neither was presented as an application error.

During testing, a genuine double-counting issue was fixed: a look-alike username cannot also earn “brand usage” points from that same username. Separate bio/description evidence is required. A stylesheet build issue and test invocation from the wrong directory were also corrected; the final verification uses the project root and passes.

## Exact run commands

From the extracted project root, Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm --prefix frontend ci
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. On later starts, use only the Uvicorn command. Do the installation/build before the event's internet becomes unavailable. Linux/macOS equivalents are in README.md.

## Demo flow

1. **0:00–0:35:** Show the default Northstar Trusted Digital Twin.
2. **0:35–1:10:** Load and analyze official social/app examples. Prove risk 0.
3. **1:10–2:05:** Analyze suspicious social/app examples. Explain the score, publisher mismatch and confidence.
4. **2:05–2:40:** Run demo scan, show dashboard counts, and connect social/app assets through a shared domain in the graph.
5. **2:40–3:20:** Ask the evidence assistant for strongest evidence and next steps.
6. **3:20–4:10:** Create an incident, save Investigating status and notes, refresh, and generate a report.
7. **4:10–4:30:** Show architecture and clearly distinguish working detection from simulated sources.

Exact speaking notes and judge questions are in `docs/DEMO.md`.

## Known limitations / quality gate

The backend, build, DOM interactions and process persistence are verified. **The full presentation quality gate is not closed:** actual browser appearance, graph geometry, file-picker behavior, responsive layout, PDF pagination and browser console checks were unavailable in this environment. Windows setup commands were not executed here. Run `docs/QA_CHECKLIST.md` on the presentation laptop before claiming presentation readiness.

This is a local single-analyst prototype. Its inputs are not independently authenticated, its heuristics are not benchmarked against real-world labeled attacks, and its confidence score is not a fraud probability. A false-positive allowlist decision remains active for the exact identity until explicitly removed. Follow-up production work is documented in README.md.

## Repository structure

- `backend/main.py`: routes and transactional orchestration.
- `backend/models.py`, `database.py`, `seed.py`: validation, storage and fixture construction.
- `backend/services/trusted_asset_service.py`: why official assets are excluded.
- `backend/services/lookalike_detector.py`: how name variations are recognized.
- `backend/services/risk_engine.py`: where every score and explanation contribution originates.
- `backend/services/visual_detector.py`: deterministic logo evidence.
- `backend/services/correlation_engine.py`: why findings become connected.
- `backend/services/explanation_service.py`: evidence-grounded answers.
- `frontend/src/pages/`: analyst views; `components/`: reusable controls, drawer and report.
- `backend/tests/`, `frontend/tests/`, `scripts/verify.py`: reproducible checks.
- `README.md`, `docs/DEMO.md`, `docs/QA_CHECKLIST.md`: setup, demo and remaining manual verification.

The source archive excludes `.venv`, `node_modules`, generated frontend output, runtime databases, caches and credentials. It is ready to inspect and upload to a repository; it has not been pushed to GitHub or publicly deployed.
