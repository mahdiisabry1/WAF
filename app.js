import express, { json } from "express";
import { existsSync, readFileSync } from "fs";
import waf from "./middleware/waf.js";
import apiRoutes from "./routes/api.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(json());
app.use(express.static("public"));

app.use(waf);
app.use("/api", apiRoutes);

// Logs API
app.get("/logs", (req, res) => {
  const logFile = "attacks.log";

  if (!existsSync(logFile)) {
    return res.json([]);
  }

  const data = readFileSync(logFile, "utf-8");

  const logs = data
    .split("\n")
    .filter(line => line)
    .map(line => JSON.parse(line));

  res.json(logs);
});

app.get("/stats", (req, res) => {

  const data = readFileSync("attacks.log", "utf-8")
    .split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line));

  const summary = {
    total: data.length,
    sql_injection: data.filter(d => d.attack_type === "SQL Injection").length,
    xss: data.filter(d => d.attack_type === "XSS").length
  };

  res.json(summary);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});