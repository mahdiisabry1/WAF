import { rules } from "../owasp/rules.js";
import { classifyMatch } from "../owasp/classifier.js";

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function buildInspectionString(req) {
  const parts = [
    req.method,
    req.originalUrl,
    safeJson(req.query),
    safeJson(req.body),
  ];
  return parts.filter(Boolean).join("\n");
}

export function createWafMiddleware({ onLog }) {
  return function waf(req, res, next) {
    const blockMode = String(process.env.WAF_BLOCK_MODE ?? "true") !== "false";
    const inspection = buildInspectionString(req);

    const matched = rules.find((r) => r.pattern.test(inspection));
    if (!matched) return next();

    const meta = classifyMatch(matched);
    const log = {
      timestamp: new Date().toISOString(),
      ip:
        (req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? "").trim() ||
        req.socket?.remoteAddress ||
        "unknown",
      method: req.method,
      path: req.originalUrl,
      userAgent: req.headers["user-agent"] ?? "",
      blocked: blockMode,
      ...meta,
    };

    onLog?.(log);

    if (!blockMode) return next();
    res.status(403).json({
      blocked: true,
      ruleId: meta.ruleId,
      category: meta.category,
      severity: meta.severity,
    });
  };
}

