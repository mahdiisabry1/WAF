import fs from "fs";

export function logAttack({ ip, method, endpoint, attackType, payload }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip,
    method,
    endpoint,
    attack_type: attackType,
    payload
  };

  fs.appendFileSync(
    "attacks.log",
    JSON.stringify(logEntry) + "\n"
  );
}