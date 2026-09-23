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
    '<div class="splash-stage" style="position:relative;width:min(86vw,540px);aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#0a0a08;box-shadow:0 22px 60px rgba(0,0,0,.65),0 0 0 1px rgba(147,216,62,.22)">' +
    '<video src="/splash-intro.mp4" poster="/splash-poster.jpg" autoplay playsinline webkit-playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#0a0a08"></video>' +
    '<img class="splash-cover" src="/splash-poster.jpg" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none;background:#0a0a08">' +
    '</div>' +
    '<div class="splash-skip" style="position:absolute;top:max(16px,env(safe-area-inset-top));right:max(16px,env(safe-area-inset-right));color:rgba(243,241,232,.85);font-size:13px;font-weight:700;padding:8px 12px;border:1px solid rgba(243,241,232,.25);border-radius:999px;background:rgba(0,0,0,.35);z-index:2">Tap to skip</div>' +
    '<button type="button" class="splash-sound" id="splash-sound" style="position:absolute;left:50%;bottom:max(64px,calc(env(safe-area-inset-bottom) + 52px));transform:translateX(-50%);z-index:3;border:1.5px solid #d6ef6a;background:rgba(26,36,72,.72);color:#d6ef6a;font-weight:800;font-size:15px;border-radius:999px;padding:12px 18px">Tap for sound</button>' +
    '<div class="splash-version" style="position:absolute;bottom:max(18px,env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:rgba(243,241,232,.7);font-size:12px;letter-spacing:.08em;z-index:2">Version 1.7.22</div>';
  document.body.appendChild(splash);
  const vid = splash.querySelector("video");
  if (vid) {
    vid.muted = false;
    vid.volume = 1;
    const p = vid.play();
    if (p && p.catch) {
      p.catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });
    }
  }
}

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existingApp = document.getElementById("app");
    if (window.__spsSongbookBooted && existingApp) {
      const stuck = document.getElementById("splash");
      if (stuck) stuck.remove();
      setReady(true);
      return;
    }
    window.__spsSongbookBooted = false;
    const oldSplash = document.getElementById("splash");
    if (oldSplash) oldSplash.remove();
    ensureSplash();
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
