import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

declare global {
  interface Window {
    __spsSongbookBooted?: boolean;
  }
}

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.__spsSongbookBooted) {
      setReady(true);
      return;
    }
    let cancelled = false;

    fetch("/songbook.html")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load songbook");
        return res.text();
      })
      .then((html) => {
        if (cancelled || window.__spsSongbookBooted) {
          if (window.__spsSongbookBooted) setReady(true);
          return;
        }
        window.__spsSongbookBooted = true;

        const parsed = new DOMParser().parseFromString(html, "text/html");
        parsed.querySelectorAll("style").forEach((style) => {
          const copy = document.createElement("style");
          copy.setAttribute("data-songbook", "1");
          copy.textContent = style.textContent;
          document.head.appendChild(copy);
        });
        parsed.body.childNodes.forEach((node) => {
          if (node.nodeName === "SCRIPT") return;
          document.body.appendChild(document.importNode(node, true));
        });
        parsed.querySelectorAll("script").forEach((old) => {
          const script = document.createElement("script");
          script.textContent = old.textContent;
          document.body.appendChild(script);
        });
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        window.__spsSongbookBooted = false;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (ready) return null;

  return (
    <p className="songbook-loading" aria-live="polite">
      Opening songbook…
    </p>
  );
}
