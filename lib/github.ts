export function parseGithubUrl(url: string): { owner: string; repo: string } {
  const u = new URL(url);
  if (u.hostname !== "github.com") {
    throw new Error("Not a github.com URL");
  }
  const [owner, repoRaw] = u.pathname.split("/").filter(Boolean);
  if (!owner || !repoRaw) {
    throw new Error("URL must look like github.com/owner/repo");
  }
  const repo = repoRaw.replace(/\.git$/, "");
  return { owner, repo };
}

export async function fetchRepoTree(owner: string, repo: string): Promise<string[]> {
  const headers = { Accept: "application/vnd.github+json" };

  // 1. get default branch
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    throw new Error(`Repo fetch failed: ${repoRes.status}`);
  }
  const { default_branch } = await repoRes.json();

  // 2. get the full tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${default_branch}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) {
    throw new Error(`Tree fetch failed: ${treeRes.status}`);
  }
  const { tree } = await treeRes.json();

  // 3. keep only files
  return tree
    .filter((item: { type: string }) => item.type === "blob")
    .map((item: { path: string }) => item.path);
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) return "";
  return res.text();
}