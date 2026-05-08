const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function classifyMatch(rule) {
  const severity = rule?.severity ?? "low";
  return {
    ruleId: rule?.id ?? "UNKNOWN",
    category: rule?.category ?? "Uncategorized",
    severity,
    severityRank: severityRank[severity] ?? 0,
    description: rule?.description ?? "",
  };
}

