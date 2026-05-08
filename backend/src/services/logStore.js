import { nanoid } from "nanoid";

export function createLogStore({ maxSize = 1000 } = {}) {
  const logs = [];

  function add(log) {
    const entry = { id: nanoid(), ...log };
    logs.unshift(entry);
    if (logs.length > maxSize) logs.length = maxSize;
    return entry;
  }

  function list({ page = 1, limit = 50, severity, blocked, ip, from, to } = {}) {
    const p = Number(page) || 1;
    const l = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    let items = logs;
    if (severity) items = items.filter((x) => x.severity === severity);
    if (typeof blocked === "boolean") items = items.filter((x) => x.blocked === blocked);
    if (ip) items = items.filter((x) => String(x.ip).includes(ip));
    if (fromDate && !Number.isNaN(fromDate.getTime()))
      items = items.filter((x) => new Date(x.timestamp) >= fromDate);
    if (toDate && !Number.isNaN(toDate.getTime()))
      items = items.filter((x) => new Date(x.timestamp) <= toDate);

    const total = items.length;
    const start = (p - 1) * l;
    const pageItems = items.slice(start, start + l);
    return { total, page: p, limit: l, items: pageItems };
  }

  function get(id) {
    return logs.find((x) => x.id === id) ?? null;
  }

  function clear() {
    logs.length = 0;
  }

  function stats() {
    const out = {
      total: logs.length,
      blocked: logs.filter((l) => l.blocked).length,
      bySeverity: {},
      byCategory: {},
      last10: logs.slice(0, 10),
    };
    for (const l of logs) {
      out.bySeverity[l.severity] = (out.bySeverity[l.severity] ?? 0) + 1;
      out.byCategory[l.category] = (out.byCategory[l.category] ?? 0) + 1;
    }
    return out;
  }

  return { add, list, get, clear, stats };
}

