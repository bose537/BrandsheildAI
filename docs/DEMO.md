# BrandShield AI — 4½-minute judge demonstration

Before the presentation, install dependencies, build once, run the server, open http://127.0.0.1:8000 and choose Northstar. Keep a terminal ready for the test command. No internet is needed after setup.

**0:00 — Trusted Digital Twin**

“Before detecting impersonation, we first define what belongs to the company. This registry contains the official logo, domain, social handles, applications and publisher.”

Show `northstar`, `northstar.example`, `com.northstar.mobile`, and `Northstar Labs`. The logo is an original demo shield, not a real company's mark.

**0:35 — Prove official exclusion**

Open Analyze Asset → Social account → Load official example → Analyze. Point to TRUSTED and 0/100.

“Our first step is exact identity verification. Similarity is not enough to grant trust.”

Close the drawer. Switch to Mobile application → Load official example → Analyze. Show the same result. App trust requires the store, package and developer.

**1:10 — Compare a suspicious social account**

Switch back to Social account. Load suspicious example, analyze, and show the score breakdown.

“This handle resembles the brand, uses support and verification language, and links outside the official domain. Every contribution is visible. The account is a candidate for investigation, not a proven fraud.”

Expand the confidence explanation. Risk is potential concern; confidence is metadata coverage and signal support. Neither is generated randomly.

**1:40 — Show a fake-app candidate**

Switch to Mobile application and load the suspicious example. Analyze it.

“This app uses the brand identity, but its developer is not in the trusted registry. Here is the publisher-mismatch contribution.”

**2:05 — Run monitoring**

Click Run demo scan, then close the drawer and open Dashboard.

“These counts come from the stored findings. The feed is a labeled 26-record demo dataset. Repeating this scan updates the same identities rather than duplicating them.”

**2:25 — Show the connection**

Open Threat Graph. Keep “Focus on campaigns” enabled. Follow a social and app node to `rewards-check.example`.

“We connect these assets because they reference the same non-official hostname and target the same brand. That suggests coordination; it does not prove the same operator controls them.”

Click a node to reopen its evidence.

**2:50 — Explain and prioritize**

Open Investigation Copilot. Choose a suspicious finding. Click Show strongest evidence → Explain from evidence. Then try What should I investigate next?

“This assistant reads stored evidence using templates. It works offline, and we do not claim it is a generative model.”

**3:20 — Respond and persist**

Open a finding and Create incident. Open Incidents, set Investigating, add “Verify publisher and preserve store listing metadata”, and Save incident. Refresh the page and show that the status remains. Open the original evidence and Generate report. Show the report; optionally use Print / save PDF.

**4:10 — Close with architecture**

Open System / Architecture. Point to official exclusion before risk scoring and source health.

“BrandShield AI turns observed identity differences into explainable, prioritized investigations. Our core works locally; real platform connectors are the next step.”

## Questions judges may ask

- **How are look-alikes detected?** Open `lookalike_detector.py`: normalization, limited character mapping, RapidFuzz ratio and supported suffix removal.
- **Why is the official account not flagged?** Open `trusted_asset_service.py`: exact platform + handle match, or store + app identifier + developer.
- **Where does the risk number come from?** Open `risk_engine.py`: six weighted signals, a single-signal cap, an explicit maximum-score adjustment, and separate confidence.
- **Why are two threats connected?** Open `correlation_engine.py`: same brand, at least two suspicious findings, exact shared non-official hostname.
- **Is this live monitoring?** No. The sources are demo fixtures or manually supplied metadata. The detection, storage, graph and incident workflows are real.
- **Is the logo score real?** Yes, it measures agreement between average-hash bits from actual images. It is a coarse heuristic and can produce collisions.
- **Can a fake publisher claim the official name?** Yes. Production ingestion must verify metadata provenance. Manual input alone cannot prove ownership.
- **Is confidence an accuracy claim?** No. It describes evidence coverage/support. We have not calibrated it against labeled attacks.
- **What happens without internet?** After dependency installation and frontend build, every core workflow works locally.
- **What prevents false positives?** Exact official exclusion, unrelatedness gating, independent evidence, single-signal cap and persistent analyst allowlisting.

Do not claim perfect detection, production readiness, real crawling, real victim counts or guaranteed hackathon results.
