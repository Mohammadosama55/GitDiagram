"use client";

import { useEffect, useRef, useState } from "react";
import { Diagram } from "./Diagram";

type Meta = {
  owner: string;
  repo: string;
  cached: boolean;
  stats: { totalFiles: number; usedFiles: number; keyFiles: number };
};

export default function RepoDiagram({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [code, setCode] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(refresh = false) {
    setLoading(true);
    setError("");
    setCode("");
    setMeta(null);

    try {
      const res = await fetch(
        `/api/diagram?url=${encodeURIComponent(url.trim())}${refresh ? "&refresh=1" : ""}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setCode(data.mermaid);
      setMeta({
        owner: data.owner,
        repo: data.repo,
        cached: !!data.cached,
        stats: data.stats,
      });

      // make the address bar a shareable link
      window.history.replaceState(null, "", `/${data.owner}/${data.repo}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // on /owner/repo pages: start drawing as soon as the page loads
  const started = useRef(false);
  useEffect(() => {
    if (initialUrl && !started.current) {
      started.current = true; // dev mode runs effects twice; this prevents a double LLM call
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div className="sheetfoot">
            <button
              type="button"
              className="redraw"
              onClick={() => generate(true)}
              disabled={loading}
            >
              Redraw
            </button>

            <dl className="titleblock">
              <div>
                <dt>Repository</dt>
                <dd>{meta.owner}/{meta.repo}</dd>
              </div>
              <div>
                <dt>Drawn</dt>
                <dd>{meta.cached ? "From saved copy" : "Just now"}</dd>
              </div>
              <div>
                <dt>Files used</dt>
                <dd>{meta.stats.usedFiles} of {meta.stats.totalFiles}</dd>
              </div>
              <div>
                <dt>Files read</dt>
                <dd>{meta.stats.keyFiles}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}