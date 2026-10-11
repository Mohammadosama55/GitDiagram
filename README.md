# Repo Diagram

Paste a public GitHub repository link and get its architecture drawn as a diagram.

**Live demo:** https://git-diagram-eosin.vercel.app/

<!-- Add a screenshot: save it as docs/screenshot.png and uncomment the next line -->
![Repo Diagram screenshot](docs/screenshot.png)

## What it does

Reading an unfamiliar codebase is slow. Repo Diagram reads a repository's file tree, README and key files, asks an LLM to describe how the pieces fit together, and renders the result as a Mermaid flowchart on a drafting-sheet style page.

- Works with any public GitHub repository
- Groups the diagram into layers such as Frontend, Backend, Database and External Services
- Shareable links: `/owner/repo` opens the diagram directly
- Download the diagram as **SVG** or **PNG**
- **Redraw** button when you want a fresh take
- Results are cached per repository, and requests are rate limited to protect the API budget

## How it works

```
GitHub URL
   │
   ▼
1. Parse owner/repo
2. Fetch file tree + README        (GitHub REST API)
3. Filter noise                    (node_modules, lock files, images, uploads...)
4. Pick key files and read them    (package.json, server/app entry points, configs)
   │
   ▼
5. Build a prompt and ask the LLM  (Groq, OpenAI-compatible API)
6. Clean the response              (strip code fences and reasoning text)
   │
   ▼
7. Render Mermaid in the browser   (mermaid.js)
```

The LLM call is the slow part (about 10 to 30 seconds). Cached repositories return almost instantly.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) and TypeScript
- [Mermaid](https://mermaid.js.org/) for rendering
- [Groq](https://groq.com/) for LLM inference, using `openai/gpt-oss-120b` with `qwen/qwen3.8-27b` as a fallback
- GitHub REST API for repository data
- Deployed on [Vercel](https://vercel.com/)

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Groq API key (or any OpenAI-compatible provider)

### Install and run

```bash
git clone https://github.com/Mohammadosama55/GitDiagram.git
cd GitDiagram
npm install
```

Create a `.env` file in the project root:

```env
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_FALLBACK_MODEL=qwen/qwen3.8-27b
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000, paste a GitHub URL and click **Draw diagram**.

### Environment variables

| Variable | Description |
|---|---|
| `LLM_API_KEY` | API key for the LLM provider |
| `LLM_BASE_URL` | Base URL of an OpenAI-compatible API, without `/chat/completions` |
| `LLM_MODEL` | Primary model name |
| `LLM_FALLBACK_MODEL` | Model to use if the primary one is busy (optional) |

Never commit your `.env` file. It is already ignored by `.gitignore`.

## API

### `GET /api/diagram`

| Query param | Description |
|---|---|
| `url` | Public GitHub repository URL (required) |
| `refresh` | Set to `1` to skip the cache and redraw |

Example response:

```json
{
  "owner": "Mohammadosama55",
  "repo": "NeighbourFix",
  "mermaid": "flowchart TD\n  ...",
  "stats": { "totalFiles": 91, "usedFiles": 76, "keyFiles": 7 },
  "cached": false
}
```

Errors return `{ "error": "..." }` with status `400`, `429` (rate limited) or `500`.

## Project structure

```
app/
├── [owner]/[repo]/page.tsx   shareable diagram pages
├── api/
│   ├── diagram/route.ts      main endpoint: GitHub data -> LLM -> Mermaid
│   └── tree/route.ts         debug endpoint: filtered file tree
├── components/
│   ├── Diagram.tsx           renders Mermaid code as SVG
│   └── RepoDiagram.tsx       form, states, downloads, title block
├── globals.css
├── layout.tsx
└── page.tsx
lib/
├── github.ts                 URL parsing, repo tree, README
├── filter.ts                 removes noise from the file tree
├── keyfiles.ts               picks and fetches key files
├── prompt.ts                 builds the LLM prompt
├── llm.ts                    LLM call with retries and model fallback
├── cache.ts                  in-memory cache with expiry
└── rateLimit.ts              per-visitor rate limiting
```

## Limitations

- Works with **public repositories** only. Private repositories return a 404 from GitHub.
- Diagram quality depends on the repository and the LLM. Use **Redraw** if the result is weak.
- Unauthenticated GitHub API access is limited to 60 requests per hour per IP.
- The cache and rate limiter are in memory. On serverless hosting they are not shared between instances, so they work best-effort.

## Roadmap

- [ ] Persistent cache and rate limiting with Redis
- [ ] GitHub token support for higher API limits
- [ ] Pan and zoom for large diagrams
- [ ] Subfolder and branch URLs (monorepos)
- [ ] Live Mermaid editor beside the diagram

## Author

**Mohammad Osama**
GitHub: [@Mohammadosama55](https://github.com/Mohammadosama55)

## License

MIT