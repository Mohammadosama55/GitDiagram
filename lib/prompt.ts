type PromptInput = {
  owner: string;
  repo: string;
  files: string[];
  readme: string;
  snippets: { path: string; content: string }[];
};

export function buildPrompt({ owner, repo, files, readme, snippets }: PromptInput) {
  const system = `You are a software architect. You read a GitHub repository summary and output ONE Mermaid diagram of its architecture.

Rules:
- Output ONLY raw Mermaid code. No explanation, no markdown fences.
- Start with: flowchart TD
- Use subgraphs to group layers (e.g. Frontend, Backend, Database, External Services).
- Node IDs: letters only, no spaces (e.g. AuthController).
- Node labels: always wrap in double quotes, e.g. A["Auth Controller"].
- Maximum 15 nodes. Show the main components and how they connect, not every file.
- Label important edges, e.g. A -->|"HTTP"| B.
- Only include things you can see evidence for in the files given.`;

  const user = `Repository: ${owner}/${repo}

README (trimmed):
${readme.slice(0, 4000)}

File tree:
${files.slice(0, 300).join("\n")}

Key file snippets:
${snippets.map((s) => `--- ${s.path} ---\n${s.content}`).join("\n\n")}

Generate the Mermaid architecture diagram.`;

  return { system, user };
}