import { NextRequest, NextResponse } from "next/server";
import { parseGithubUrl, fetchRepoTree, fetchReadme } from "@/lib/github";
import { filterTree } from "@/lib/filter";
import { pickKeyFiles, fetchSnippets } from "@/lib/keyfiles";
import { buildPrompt } from "@/lib/prompt";
import { generateMermaid } from "@/lib/llm";
import { getCached, setCached } from "@/lib/cache";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const { owner, repo } = parseGithubUrl(url);
    const key = `${owner}/${repo}`.toLowerCase();

    // 1. cache first, so repeat views are free
    const cached = getCached(key);
    if (cached) {
      return NextResponse.json({ owner, repo, mermaid: cached, cached: true });
    }

    // 2. rate limit, only for requests that will actually call the LLM
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a few minutes." },
        { status: 429 }
      );
    }

    // 3. fetch repo data
    const [allFiles, readme] = await Promise.all([
      fetchRepoTree(owner, repo),
      fetchReadme(owner, repo),
    ]);

    const files = filterTree(allFiles);
    const snippets = await fetchSnippets(owner, repo, pickKeyFiles(files));

    // 4. ask the LLM, then save the result
    const { system, user } = buildPrompt({ owner, repo, files, readme, snippets });
    const mermaid = await generateMermaid(system, user);

    setCached(key, mermaid);

    return NextResponse.json({ owner, repo, mermaid });
  } catch (e) {
    const err = e as Error & { cause?: unknown };
    console.error("DIAGRAM ERROR:", err, "CAUSE:", err.cause);
    return NextResponse.json(
      { error: err.message, cause: String(err.cause ?? "") },
      { status: 500 }
    );
  }
}