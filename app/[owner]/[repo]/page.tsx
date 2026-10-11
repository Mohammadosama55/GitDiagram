import RepoDiagram from "../../components/RepoDiagram";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  return <RepoDiagram initialUrl={`https://github.com/${owner}/${repo}`} />;
}