import React, { useState, useEffect } from "react";
import { ChevronRight, MessageSquare, ArrowUpRight } from "lucide-react";
import { Field, Empty, label, questions } from "../components/shared.jsx";
import { api } from "../api";
export default function Copilot({ findings, onError, onSelect }) {
  const [fid, setFid] = useState("");
  const [question, setQuestion] = useState(questions[0]);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = findings.find((f) => f.id === (fid || findings[0]?.id));
  useEffect(() => {
    setResponse("");
  }, [fid, question]);
  async function ask() {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await api(
        `/copilot/${selected.id}?question=${encodeURIComponent(question)}`,
      );
      setResponse(r.answer);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!findings.length)
    return (
      <Empty title="Evidence comes first">
        Analyze an asset or run a scan before asking the evidence assistant.
      </Empty>
    );
  return (
    <div className="lab-grid">
      <section className="panel form-panel">
        <span className="eyebrow accent">EVIDENCE ASSISTANT</span>
        <h2>Ask about a finding.</h2>
        <p>
          Answers are assembled from stored evidence using deterministic
          templates. No paid API or generative model is involved.
        </p>
        <Field label="Finding">
          <select
            value={selected?.id || ""}
            onChange={(e) => setFid(e.target.value)}
          >
            {findings.map((f) => (
              <option value={f.id} key={f.id}>
                {label(f)} · {f.risk}/100
              </option>
            ))}
          </select>
        </Field>
        <div className="question-list">
          {questions.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className={q === question ? "active" : ""}
            >
              {q}
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        <button className="primary" disabled={busy} onClick={ask}>
          <MessageSquare size={16} />
          {busy ? "Reading evidence…" : "Explain from evidence"}
        </button>
      </section>
      <section className="panel form-panel answer-panel">
        <span className="eyebrow">INVESTIGATION RESPONSE</span>
        {response ? (
          <>
            <h2>{question}</h2>
            <p className="answer">{response}</p>
            <button className="text-button" onClick={() => onSelect(selected)}>
              Inspect source evidence <ArrowUpRight size={15} />
            </button>
          </>
        ) : (
          <Empty title="Grounded in this finding">
            Choose a question to inspect its evidence, verification status or
            next steps.
          </Empty>
        )}
      </section>
    </div>
  );
}
