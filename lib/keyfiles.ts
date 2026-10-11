const KEY_NAMES = new Set([
  // dependencies / project type
  "package.json", "requirements.txt", "pyproject.toml", "go.mod", "pom.xml",
  "dockerfile", "docker-compose.yml",
  // entry points
  "server.js", "app.js", "index.js", "main.js", "main.ts", "index.ts",
  "main.py", "app.py", "main.jsx", "main.tsx", "app.jsx", "app.tsx",
  "layout.tsx",
  // config
  "vite.config.js", "next.config.js", "next.config.ts",
]);

export function pickKeyFiles(paths: string[], max = 10): string[] {
  return paths
    .filter((p) => KEY_NAMES.has(p.split("/").pop()!.toLowerCase()))
    .sort((a, b) => a.split("/").length - b.split("/").length) // shallow first
    .slice(0, max);
}
async function fetchOne(owner: string, repo: string, path: string): Promise<string | null> {
  // 1. try raw host (doesn't use API rate limit)
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) return res.text();
  } catch {
    // fall through to API
  }

  // 2. fallback: GitHub API (counts toward the 60/hr limit)
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: { Accept: "application/vnd.github.raw+json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) return res.text();
  } catch {
    // give up on this file
  }

  return null;
}

export async function fetchSnippets(
  owner: string,
  repo: string,
  paths: string[],
  maxChars = 3000
): Promise<{ path: string; content: string }[]> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const text = await fetchOne(owner, repo, path);
      return text ? { path, content: text.slice(0, maxChars) } : null;
    })
  );
  return results.filter((r): r is { path: string; content: string } => r !== null);
}

// export async function fetchSnippets(
//   owner: string,
//   repo: string,
//   paths: string[],
//   maxChars = 3000
// ): Promise<{ path: string; content: string }[]> {
//   const results = await Promise.all(
//     paths.map(async (path) => {
//       const res = await fetch(
//         `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`
//       );
//       if (!res.ok) return null;
//       const text = await res.text();
//       return { path, content: text.slice(0, maxChars) };
//     })
//   );
//   return results.filter((r): r is { path: string; content: string } => r !== null);
// }