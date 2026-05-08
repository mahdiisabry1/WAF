const $ = (id) => document.getElementById(id);

const els = {
  wsStatus: $("wsStatus"),
  refreshBtn: $("refreshBtn"),
  clearBtn: $("clearBtn"),
  toggleAutoBtn: $("toggleAutoBtn"),
  autoState: $("autoState"),
  kpiTotal: $("kpiTotal"),
  kpiBlocked: $("kpiBlocked"),
  kpiCritical: $("kpiCritical"),
  kpiHigh: $("kpiHigh"),
  logsTbody: $("logsTbody"),
};

let auto = true;

function tagForSeverity(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  return "good";
}

function renderStats(stats) {
  els.kpiTotal.textContent = String(stats.total ?? 0);
  els.kpiBlocked.textContent = String(stats.blocked ?? 0);
  els.kpiCritical.textContent = String(stats.bySeverity?.critical ?? 0);
  els.kpiHigh.textContent = String(stats.bySeverity?.high ?? 0);
}

function renderLogs(items) {
  const rows = items.map((l) => {
    const t = new Date(l.timestamp).toLocaleTimeString();
    const sevClass = tagForSeverity(l.severity);
    const blockedClass = l.blocked ? "bad" : "good";
    const blockedText = l.blocked ? "true" : "false";
    return `
      <tr>
        <td class="mono small">${t}</td>
        <td class="mono small">${escapeHtml(l.ip ?? "")}</td>
        <td class="mono small">${escapeHtml(l.method ?? "")}</td>
        <td class="mono small">${escapeHtml(l.path ?? "")}</td>
        <td><span class="tag ${sevClass}">${escapeHtml(l.severity ?? "")}</span></td>
        <td><span class="tag ${blockedClass}">${blockedText}</span></td>
        <td class="mono small">${escapeHtml(l.ruleId ?? "")}</td>
        <td class="small">${escapeHtml(l.category ?? "")}</td>
      </tr>
    `.trim();
  });

  els.logsTbody.innerHTML =
    rows.length > 0
      ? rows.join("")
      : `<tr><td colspan="8" class="muted">No logs yet.</td></tr>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function refresh() {
  const [stats, logs] = await Promise.all([
    fetch("/api/stats").then((r) => r.json()),
    fetch("/api/logs?limit=50").then((r) => r.json()),
  ]);
  renderStats(stats);
  renderLogs(logs.items ?? []);
}

async function clearLogs() {
  await fetch("/api/logs", { method: "DELETE" });
  await refresh();
}

function wsUrl() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/ws`;
}

function connectWs() {
  const ws = new WebSocket(wsUrl());
  els.wsStatus.textContent = "connecting…";

  ws.addEventListener("open", () => {
    els.wsStatus.textContent = "connected";
  });
  ws.addEventListener("close", () => {
    els.wsStatus.textContent = "disconnected";
    setTimeout(connectWs, 800);
  });
  ws.addEventListener("error", () => {
    els.wsStatus.textContent = "error";
  });

  ws.addEventListener("message", (ev) => {
    if (!auto) return;
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }

    if (msg.type === "stats") {
      renderStats(msg.data ?? {});
      return;
    }
    if (msg.type === "log") {
      // Fast path: prepend the log row without refetching.
      const current = Array.from(els.logsTbody.querySelectorAll("tr")).slice(0, 49);
      const newItem = msg.data;
      const tmp = document.createElement("tbody");
      tmp.innerHTML = "";
      renderLogs([newItem]);
      const first = els.logsTbody.querySelector("tr");
      const newRow = first?.cloneNode(true);
      // Restore old rows after the new row
      const out = document.createElement("tbody");
      if (newRow) out.appendChild(newRow);
      for (const tr of current) out.appendChild(tr.cloneNode(true));
      els.logsTbody.innerHTML = out.innerHTML;
    }
  });
}

els.refreshBtn.addEventListener("click", () => refresh());
els.clearBtn.addEventListener("click", () => clearLogs());
els.toggleAutoBtn.addEventListener("click", () => {
  auto = !auto;
  els.autoState.textContent = auto ? "on" : "off";
});

refresh().catch(() => {});
connectWs();

