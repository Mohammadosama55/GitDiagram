import { NextRequest, NextResponse } from "next/server";
import { parseGithubUrl, fetchRepoTree, fetchReadme } from "@/lib/github";
import { filterTree } from "@/lib/filter";
import { pickKeyFiles, fetchSnippets } from "@/lib/keyfiles";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const { owner, repo } = parseGithubUrl(url);

    const [allFiles, readme] = await Promise.all([
      fetchRepoTree(owner, repo),
      fetchReadme(owner, repo),
    ]);

    const files = filterTree(allFiles);
    const keyPaths = pickKeyFiles(files);
    const snippets = await fetchSnippets(owner, repo, keyPaths);

    return NextResponse.json({
      owner,
      repo,
      totalCount: allFiles.length,
      count: files.length,
      readmeLength: readme.length,
      keyFiles: snippets.map((s) => ({ path: s.path, chars: s.content.length })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

