import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

declare global {
  interface Window {
    __spsSongbookBooted?: boolean;
  }
}

function ensureSplash() {
  if (document.getElementById("splash")) return;
  const splash = document.createElement("div");
  splash.id = "splash";
  splash.setAttribute(
    "style",
    "position:fixed;inset:0;z-index:999;background:#000;display:flex;align-items:center;justify-content:center;",
  );
  splash.innerHTML =
    '<video src="/splash-intro.mp4" poster="/splash-poster.jpg" autoplay muted playsinline webkit-playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000"></video>' +
    '<div style="position:absolute;top:max(16px,env(safe-area-inset-top));right:max(16px,env(safe-area-inset-right));color:rgba(243,241,232,.85);font-size:13px;font-weight:700;padding:8px 12px;border:1px solid rgba(243,241,232,.25);border-radius:999px;background:rgba(0,0,0,.35);z-index:2">Tap to skip</div>' +
    '<div style="position:absolute;bottom:max(18px,env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:rgba(243,241,232,.7);font-size:12px;letter-spacing:.08em;z-index:2">Version 1.6.3</div>';
  document.body.appendChild(splash);
  const vid = splash.querySelector("video");
  if (vid) {
    vid.muted = true;
    const p = vid.play();
    if (p && p.catch) p.catch(() => {});
  }
}

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSplash();
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
        if (cancelled) return;
        if (window.__spsSongbookBooted) {
          setReady(true);
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
          if ((node as HTMLElement).id === "splash") return;
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
        setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (ready) return null;
  return null;
}
