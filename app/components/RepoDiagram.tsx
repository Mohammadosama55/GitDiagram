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
  function getSvg(): SVGSVGElement | null {
    return document.querySelector(".sheet svg");
  }

  function saveBlob(blob: Blob, filename: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadSvg() {
    const svg = getSvg();
    if (!svg || !meta) return;
    const xml = new XMLSerializer().serializeToString(svg);
    saveBlob(new Blob([xml], { type: "image/svg+xml" }), `${meta.repo}-architecture.svg`);
  }

  function downloadPng() {
    const svg = getSvg();
    if (!svg || !meta) return;

    const box = svg.viewBox.baseVal;
    const w = box.width || svg.clientWidth;
    const h = box.height || svg.clientHeight;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));

    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));

    const img = new Image();
    img.onload = () => {
      const scale = 2; // sharper image
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#F8FAFB"; // sheet color, so the PNG isn't transparent
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) saveBlob(blob, `${meta.repo}-architecture.png`);
      }, "image/png");
    };
    img.src = url;
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
          <div className="sheetfoot">
            <div className="actions">
              <button type="button" className="redraw" onClick={() => generate(true)} disabled={loading}>
                Redraw
              </button>
              <button type="button" className="redraw" onClick={downloadSvg}>
                Download SVG
              </button>
              <button type="button" className="redraw" onClick={downloadPng}>
                Download PNG
              </button>
            </div>

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