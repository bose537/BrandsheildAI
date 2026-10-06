# Final laptop QA before the presentation

Automated checks do not replace this real-browser pass. Run in Chrome or Edge at the local URL. The build environment could test the DOM and API but could not perform visual browser QA.

- [ ] Open all nine navigation items; check readable layout at laptop size and a narrow window.
- [ ] Add and edit a separate brand; add multiple domain/publisher/variation lines.
- [ ] Add/remove official social and app entries. Duplicate identities should show a readable error.
- [ ] Upload a small PNG/JPG/WebP logo; verify preview and save. Invalid or oversized files must be rejected.
- [ ] Analyze official social and app examples: TRUSTED, risk 0.
- [ ] Analyze suspicious social and app examples: evidence, publisher mismatch and score contributions are visible.
- [ ] Test a plain look-alike handle with no additional metadata: score capped at 19.
- [ ] Run demo scan twice: 26 default-brand findings, no duplicates.
- [ ] Filter/search both monitoring tables and open finding details with the keyboard.
- [ ] Open the graph, zoom, switch campaign filter off/on, click a social and app node.
- [ ] Ask all evidence-assistant questions; confirm no invented relationships.
- [ ] Create an incident, save notes/status, refresh, and restart the server; verify persistence.
- [ ] Mark a finding false positive, scan again, verify allowlisting, then remove the allowlist.
- [ ] Generate a report; inspect actual Print / Save as PDF pagination.
- [ ] Stop the backend during use: readable failure state. Restart and Retry.
- [ ] Use browser back/forward and refresh on a non-dashboard route.
- [ ] Inspect browser developer-console errors and network failures.
- [ ] Disconnect internet after setup and repeat the main demo flow.

If needed, back up the local database before clearing it. A fresh database is created automatically on restart, but removing it deletes that local run's findings and notes. Do not reset during a presentation.
