import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DPxWRPsx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (window.__spsSongbookBooted) {
			setReady(true);
			return;
		}
		let cancelled = false;
		fetch("/songbook.html").then((res) => {
			if (!res.ok) throw new Error("Could not load songbook");
			return res.text();
		}).then((html) => {
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
		}).catch((err) => {
			console.error(err);
			window.__spsSongbookBooted = false;
		});
		return () => {
			cancelled = true;
		};
	}, []);
	if (ready) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "songbook-loading",
		"aria-live": "polite",
		children: "Opening songbook…"
	});
}
//#endregion
export { Home as component };
