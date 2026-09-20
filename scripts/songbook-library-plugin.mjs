import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data", "songbook-library.json");

function readLibrary() {
  try {
    const raw = readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.songs)) return parsed;
  } catch {
    /* missing is fine */
  }
  return { songs: [], settings: {} };
}

function writeLibrary(obj) {
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(obj, null, 2));
}

export function songbookLibraryPlugin() {
  return {
    name: "songbook-library",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = String(req.url ?? "").split("?", 1)[0];
        if (pathOnly !== "/api/songbook-library") {
          next();
          return;
        }
        res.setHeader("content-type", "application/json; charset=utf-8");
        const method = (req.method ?? "GET").toUpperCase();
        if (method === "GET") {
          res.end(JSON.stringify(readLibrary()));
          return;
        }
        if (method === "POST") {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
            if (!body || !Array.isArray(body.songs)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: "songs array required" }));
              return;
            }
            writeLibrary({
              songs: body.songs,
              settings: body.settings || {},
              savedAt: new Date().toISOString(),
            });
            res.end(JSON.stringify({ ok: true, count: body.songs.length }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
          }
          return;
        }
        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false }));
      });
    },
  };
}
