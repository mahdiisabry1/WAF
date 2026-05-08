import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import morgan from "morgan";
import { WebSocketServer } from "ws";

import { createWafMiddleware } from "./middleware/waf.js";
import { createLogStore } from "./services/logStore.js";
import { createWsHub } from "./services/wsHub.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const store = createLogStore({ maxSize: 2000 });

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const hub = createWsHub(wss);

function emit(logEntry) {
  hub.broadcast({ type: "log", data: logEntry });
  hub.broadcast({ type: "stats", data: store.stats() });
}

app.use(
  createWafMiddleware({
    onLog: (log) => {
      const entry = store.add(log);
      emit(entry);
    },
  }),
);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    blockMode: String(process.env.WAF_BLOCK_MODE ?? "true") !== "false",
    now: new Date().toISOString(),
  });
});

app.get("/api/stats", (req, res) => {
  res.json(store.stats());
});

app.get("/api/logs", (req, res) => {
  const blockedParam = req.query.blocked;
  const blocked =
    blockedParam === undefined
      ? undefined
      : blockedParam === "true"
        ? true
        : blockedParam === "false"
          ? false
          : undefined;

  res.json(
    store.list({
      page: req.query.page,
      limit: req.query.limit,
      severity: req.query.severity,
      blocked,
      ip: req.query.ip,
      from: req.query.from,
      to: req.query.to,
    }),
  );
});

app.get("/api/logs/:id", (req, res) => {
  const log = store.get(req.params.id);
  if (!log) return res.status(404).json({ error: "Not found" });
  res.json(log);
});

app.delete("/api/logs", (req, res) => {
  store.clear();
  hub.broadcast({ type: "stats", data: store.stats() });
  res.json({ ok: true });
});

// Minimal vulnerable-ish routes for simulator
app.get("/api/test/a03/search", (req, res) => {
  const q = String(req.query.q ?? "");
  res.json({ ok: true, echo: q });
});

app.get("/api/test/a07/file", (req, res) => {
  const name = String(req.query.name ?? "README.md");
  res.json({ ok: true, requested: name });
});

app.get("/api/test/a10/fetch", (req, res) => {
  const url = String(req.query.url ?? "");
  res.json({ ok: true, url });
});

// Serve the MVP UI from /frontend
const frontendDir = path.resolve(__dirname, "../../frontend");
app.use(express.static(frontendDir));
app.get("/", (req, res) => res.redirect("/dashboard.html"));

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "hello", data: { now: new Date().toISOString() } }));
  ws.send(JSON.stringify({ type: "stats", data: store.stats() }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MVP server listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});

