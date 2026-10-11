"use client";

import { useState } from "react";
import { Diagram } from "./components/Diagram";

type Meta = { owner: string; repo: string; cached: boolean };

export default function Home() {
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setCode("");
    setMeta(null);

    try {
      const res = await fetch(`/api/diagram?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setCode(data.mermaid);
      setMeta({ owner: data.owner, repo: data.repo, cached: !!data.cached });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Draw any repo&apos;s architecture.</h1>
      <p className="lede">
        Paste a public GitHub link. You get a diagram of how the code fits together.
      </p>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          aria-label="GitHub repository URL"
        />
        <button type="submit" disabled={loading || !url.trim()}>
          {loading ? "Drawing…" : "Draw diagram"}
        </button>
      </form>

      <section className="sheet" aria-live="polite">
        {error && <p className="error">{error}</p>}
        {loading && (
          <p className="hint">Reading the repo and drafting. This takes 10 to 30 seconds.</p>
        )}
        {!loading && !error && !code && (
          <p className="hint">Your diagram will appear here.</p>
        )}
        {code && <Diagram code={code} />}

        {meta && (
          <dl className="titleblock">
            <div>
              <dt>Repository</dt>
              <dd>
                {meta.owner}/{meta.repo}
              </dd>
            </div>
            <div>
              <dt>Drawn</dt>
              <dd>{meta.cached ? "From saved copy" : "Just now"}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}