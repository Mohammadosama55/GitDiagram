"use client";

import { useEffect, useRef, useState } from "react";

export function Diagram({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function draw() {
            try {
                // import inside the effect: mermaid needs the browser
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "base",
                    themeVariables: {
                        fontFamily: getComputedStyle(document.body).fontFamily,
                        primaryColor: "#F8FAFB",
                        primaryBorderColor: "#12233D",
                        primaryTextColor: "#12233D",
                        lineColor: "#12233D",
                        clusterBkg: "#EAEFF3",
                        clusterBorder: "#5B6B80",
                        edgeLabelBackground: "#F8FAFB",
                    },
                });

                const id = "diagram-" + Math.random().toString(36).slice(2);
                const { svg } = await mermaid.render(id, code);

                if (!cancelled && ref.current) {
                    ref.current.innerHTML = svg;
                    setError("");
                }
            } catch (e) {
                if (!cancelled) setError((e as Error).message);
            }
        }

        draw();
        return () => {
            cancelled = true;
        };
    }, [code]);

    if (error) {
        return (
            <div>
                <p style={{ color: "tomato" }}>Diagram failed to render: {error}</p>
                <pre style={{ whiteSpace: "pre-wrap" }}>{code}</pre>
            </div>
        );
    }

    return <div ref={ref} />;
}