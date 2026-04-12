import { logAttack } from "../utils/logger.js";

const patterns = [
  { regex: /OR 1=1/i, type: "SQL Injection" },
  { regex: /<script>/i, type: "XSS" },
  { regex: /DROP TABLE/i, type: "SQL Injection" },
  { regex: /UNION SELECT/i, type: "SQL Injection" }
];

export default (req, res, next) => {
  const body = JSON.stringify(req.body);
  const url = req.url;
  const ip = req.ip;
  const method = req.method;

  for (let pattern of patterns) {
    if (pattern.regex.test(body) || pattern.regex.test(url)) {

      logAttack({
        ip,
        method,
        endpoint: url,
        attackType: pattern.type,
        payload: body
      });

      console.log("🚨 Attack detected:", pattern.type);

      return res.status(403).json({
        message: `Blocked by WAF (${pattern.type})`
      });
    }
  }

  next();
};