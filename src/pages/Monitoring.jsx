import React, { useState } from "react";
import { Search } from "lucide-react";
import { FindingsTable } from "../components/shared.jsx";
export default function Monitoring({ channel, findings, onSelect }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const rows = findings.filter(
    (f) =>
      f.candidate.channel === channel &&
      (filter === "All" || f.status === filter) &&
      JSON.stringify([
        f.candidate.username,
        f.candidate.name,
        f.candidate.developer,
        f.threat,
      ])
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="notice source-notice">
        <span className="dot" />
        <p>
          <strong>Demo dataset + manually supplied metadata.</strong> No live
          crawling is connected. Exact official identities are excluded before
          detection.
        </p>
      </div>
      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={16} />
            <input
              aria-label="Search findings"
              placeholder="Search asset, publisher or threat…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "All",
              "SUSPICIOUS",
              "TRUSTED",
              "REVIEW",
              "NO MATCH",
              "ALLOWLISTED",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <span className="dim">{rows.length} assets</span>
        </div>
        <FindingsTable rows={rows} onSelect={onSelect} />
      </section>
    </>
  );
}
