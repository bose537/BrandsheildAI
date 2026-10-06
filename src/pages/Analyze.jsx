import React, { useState } from "react";
import {
  Users,
  AppWindow,
  ScanLine,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Field, LogoInput } from "../components/shared.jsx";
export default function Analyze({ brand, onAnalyze, busy, onError }) {
  const blank = {
    channel: "social",
    platform: "Instagram",
    username: "",
    name: "",
    bio: "",
    url: "",
    store: "Google Play",
    package: "",
    developer: "",
    description: "",
    logo: "",
  };
  const [form, setForm] = useState(blank);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const social = form.channel === "social";
  function example(trusted) {
    if (social) {
      const official = brand.socials[0];
      setForm({
        ...blank,
        platform: official?.platform || "Instagram",
        username: trusted
          ? official?.username || ""
          : (official?.username || brand.name.toLowerCase()) +
            "_support_verify",
        name: brand.name,
        bio: trusted
          ? "Official account"
          : "Official support. Verify your login and password.",
        url: trusted ? brand.website : "https://rewards-check.example/claim",
        logo: brand.logo,
      });
    } else {
      const official = brand.apps[0];
      setForm({
        ...blank,
        channel: "app",
        store: official?.store || "Google Play",
        name: trusted
          ? official?.name || brand.name
          : brand.name + " Rewards Pro",
        developer: trusted ? official?.developer || "" : "Rewards Corporation",
        package: trusted ? official?.package || "" : "com.rewards.pro",
        description: trusted
          ? "Official application"
          : "Official " + brand.name + " rewards. Verify your login.",
        url: trusted ? brand.website : "https://rewards-check.example/claim",
        logo: brand.logo,
      });
    }
  }
  return (
    <div className="lab-grid">
      <section className="panel form-panel">
        <div className="segmented">
          <button
            type="button"
            className={social ? "active" : ""}
            onClick={() => setForm({ ...blank, channel: "social" })}
          >
            <Users size={16} /> Social account
          </button>
          <button
            type="button"
            className={!social ? "active" : ""}
            onClick={() => setForm({ ...blank, channel: "app" })}
          >
            <AppWindow size={16} /> Mobile application
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAnalyze({ ...form, brand_id: brand.id });
          }}
        >
          {social ? (
            <>
              <div className="two-col">
                <Field label="Platform">
                  <select
                    value={form.platform}
                    onChange={(e) => set("platform", e.target.value)}
                  >
                    {["Instagram", "X", "Facebook", "LinkedIn"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Username *">
                  <input
                    required
                    maxLength={100}
                    pattern="[^\s/]+"
                    placeholder="brand_support"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Display name">
                <input
                  value={form.name}
                  maxLength={120}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Profile bio">
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="App name *">
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <div className="two-col">
                <Field label="Developer / publisher *">
                  <input
                    required
                    maxLength={120}
                    value={form.developer}
                    onChange={(e) => set("developer", e.target.value)}
                  />
                </Field>
                <Field label="Store">
                  <select
                    value={form.store}
                    onChange={(e) => set("store", e.target.value)}
                  >
                    <option>Google Play</option>
                    <option>Apple App Store</option>
                  </select>
                </Field>
              </div>
              <Field
                label="Package / store identifier"
                hint="Needed to prove an exact official app match."
              >
                <input
                  maxLength={180}
                  value={form.package}
                  onChange={(e) => set("package", e.target.value)}
                  placeholder="com.brand.mobile"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </>
          )}
          <Field
            label="Linked website"
            hint="Metadata only. Suspicious links are never opened or fetched."
          >
            <input
              type="url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </Field>
          <Field label="Candidate logo (optional)">
            <LogoInput
              value={form.logo}
              onChange={(v) => set("logo", v)}
              onError={onError}
            />
          </Field>
          <button disabled={busy} className="primary wide">
            <ScanLine size={17} />
            {busy ? "Analyzing…" : "Analyze asset"}
          </button>
        </form>
      </section>
      <aside>
        <div className="panel form-panel">
          <span className="eyebrow accent">MANUAL ANALYSIS LAB</span>
          <h2>Put the evidence to the test.</h2>
          <p>
            Supply profile or app metadata. The same engine powers this lab and
            the monitoring feed.
          </p>
          <div className="sample-buttons">
            <button
              className="secondary"
              onClick={() => example(true)}
              disabled={social ? !brand.socials.length : !brand.apps.length}
            >
              <ShieldCheck size={16} /> Load official example
            </button>
            <button className="secondary" onClick={() => example(false)}>
              <AlertCircle size={16} /> Load suspicious example
            </button>
          </div>
          <div className="mini-steps">
            {[
              "Check exact official identity",
              "Normalize look-alike variations",
              "Compare independent evidence",
              "Calculate risk and confidence",
              "Recommend an investigation",
            ].map((s, i) => (
              <div key={s}>
                <span>0{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="notice">
          <AlertCircle size={18} />
          <p>
            Risk measures potential concern. Confidence measures evidence
            support, not certainty of fraud. This prototype does not fetch or
            authenticate platform metadata.
          </p>
        </div>
      </aside>
    </div>
  );
}
