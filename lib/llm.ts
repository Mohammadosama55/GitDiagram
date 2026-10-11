export async function generateMermaid(system: string, user: string): Promise<string> {
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  return cleanMermaid(raw);
}

function cleanMermaid(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/g, "") // Qwen may emit reasoning blocks
    .replace(/```mermaid/gi, "")
    .replace(/```/g, "")
    .trim();
}