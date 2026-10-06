import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Plus,
  X,
  AppWindow,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Badge, Field, LogoInput, emptyBrand } from "../components/shared.jsx";
export default function BrandEditor({ brand, onSave, busy, onError, onNew }) {
  const [form, setForm] = useState(emptyBrand);
  useEffect(() => {
    setForm(
      brand
        ? Object.fromEntries(Object.keys(emptyBrand).map((k) => [k, brand[k]]))
        : emptyBrand,
    );
  }, [brand]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const list = (key, value) => set(key, value.split("\n"));
  const changeRow = (key, index, field, value) =>
    set(
      key,
      form[key].map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="identity-strip">
        <Fingerprint size={30} />
        <div>
          <h2>Define what is genuinely yours.</h2>
          <p>
            Exact registered identities are excluded before risk scoring. A
            similar name alone is never trusted.
          </p>
        </div>
        <button type="button" className="secondary" onClick={onNew}>
          <Plus size={16} /> New brand
        </button>
      </div>
      <div className="form-grid">
        <section className="panel form-panel">
          <h2>Brand identity</h2>
          <LogoInput
            value={form.logo}
            onChange={(v) => set("logo", v)}
            onError={onError}
          />
          <Field label="Brand name">
            <input
              required
              minLength={2}
              maxLength={120}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your organization"
            />
          </Field>
          <Field label="Official website">
            <input
              required
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://yourbrand.com"
            />
          </Field>
          <Field
            label="Additional official domains"
            hint="One hostname per line. Website hostname is included automatically."
          >
            <textarea
              value={form.domains.join("\n")}
              onChange={(e) => list("domains", e.target.value)}
              placeholder="yourbrand.com"
            />
          </Field>
          <Field
            label="Official publishers"
            hint="Names support verification; they do not automatically trust an unknown app."
          >
            <textarea
              value={form.publishers.join("\n")}
              onChange={(e) => list("publishers", e.target.value)}
              placeholder="One publisher per line"
            />
          </Field>
          <Field label="Known legitimate name variations">
            <textarea
              value={form.variations.join("\n")}
              onChange={(e) => list("variations", e.target.value)}
              placeholder="One variation per line"
            />
          </Field>
          <Field
            label="Brand keywords"
            hint="Stored as analyst context. Not independently scored."
          >
            <textarea
              value={form.keywords.join("\n")}
              onChange={(e) => list("keywords", e.target.value)}
              placeholder="One keyword per line"
            />
          </Field>
        </section>
        <div>
          <section className="panel form-panel">
            <div className="panel-heading">
              <h2>Official social identities</h2>
              <Badge kind="trusted">Exact match</Badge>
            </div>
            {form.socials.map((s, i) => (
              <div className="registry-row" key={i}>
                <Field label="Platform">
                  <select
                    value={s.platform}
                    onChange={(e) =>
                      changeRow("socials", i, "platform", e.target.value)
                    }
                  >
                    {["Instagram", "X", "Facebook", "LinkedIn"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Handle">
                  <input
                    required
                    value={s.username}
                    onChange={(e) =>
                      changeRow("socials", i, "username", e.target.value)
                    }
                    placeholder="brand"
                  />
                </Field>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove social identity"
                  onClick={() =>
                    set(
                      "socials",
                      form.socials.filter((_, j) => i !== j),
                    )
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                set("socials", [
                  ...form.socials,
                  { platform: "Instagram", username: "" },
                ])
              }
            >
              <Plus size={14} /> Add official account
            </button>
          </section>
          <section className="panel form-panel">
            <div className="panel-heading">
              <h2>Official applications</h2>
              <AppWindow size={18} />
            </div>
            {form.apps.map((a, i) => (
              <div className="app-registry" key={i}>
                <Field label="App name">
                  <input
                    required
                    value={a.name}
                    onChange={(e) =>
                      changeRow("apps", i, "name", e.target.value)
                    }
                  />
                </Field>
                <Field label="Store">
                  <select
                    value={a.store}
                    onChange={(e) =>
                      changeRow("apps", i, "store", e.target.value)
                    }
                  >
                    <option>Google Play</option>
                    <option>Apple App Store</option>
                  </select>
                </Field>
                <Field label="Package / store identifier">
                  <input
                    required
                    value={a.package}
                    onChange={(e) =>
                      changeRow("apps", i, "package", e.target.value)
                    }
                    placeholder="com.brand.mobile"
                  />
                </Field>
                <Field label="Developer">
                  <input
                    required
                    value={a.developer}
                    onChange={(e) =>
                      changeRow("apps", i, "developer", e.target.value)
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() =>
                    set(
                      "apps",
                      form.apps.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove app
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                set("apps", [
                  ...form.apps,
                  {
                    name: "",
                    store: "Google Play",
                    package: "",
                    developer: "",
                  },
                ])
              }
            >
              <Plus size={14} /> Add official app
            </button>
          </section>
          <div className="notice">
            <ShieldCheck size={20} />
            <p>
              Social trust = platform + exact handle.
              <br />
              App trust = store + exact identifier + developer.
              <br />
              Links and publisher names alone cannot grant trust.
            </p>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <span>
          Saving recalculates existing findings against this identity.
        </span>
        <button disabled={busy} className="primary">
          <Check size={16} />
          {busy
            ? "Saving…"
            : brand
              ? "Save trusted identity"
              : "Register brand"}
        </button>
      </div>
    </form>
  );
}
