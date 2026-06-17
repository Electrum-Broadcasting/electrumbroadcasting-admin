import { useState } from "react";

export type ModerationRule = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  severity: "low" | "medium" | "high";
  applies_to: "posts" | "comments" | "contributors";
  trigger_type: string;
  trigger_value: number | string | null;
};

const TRIGGER_TYPES = [
  "moderation_rule",
  "fraud_rule",
  "fraud_level_is",
  "fraud_score_above",
  "flag_threshold",
  "fraud_signal",
] as const;

export default function ModerationRulesTable({
  rules,
  onChange,
}: {
  rules: ModerationRule[];
  onChange: (rules: ModerationRule[]) => void;
}) {
  const [localRules, setLocalRules] = useState<ModerationRule[]>(rules);

  function updateRule(id: string, patch: Partial<ModerationRule>) {
    const updated = localRules.map((r) =>
      r.id === id ? { ...r, ...patch } : r
    );
    setLocalRules(updated);
    onChange(updated);
  }

  function deleteRule(id: string) {
    const updated = localRules.filter((r) => r.id !== id);
    setLocalRules(updated);
    onChange(updated);
  }

  function createNewRule() {
    const newRule: ModerationRule = {
      id: `temp-${crypto.randomUUID()}`,
      label: "New Rule",
      description: "",
      enabled: true,
      severity: "low",
      applies_to: "posts",
      trigger_type: "moderation_rule",
      trigger_value: null,
    };

    const updated = [...localRules, newRule];
    setLocalRules(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={createNewRule}
        className="px-3 py-2 bg-blue-600 text-white rounded"
      >
        + Add Rule
      </button>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Label</th>
            <th className="border p-2">Trigger Type</th>
            <th className="border p-2">Trigger Value</th>
            <th className="border p-2">Severity</th>
            <th className="border p-2">Enabled</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {localRules.map((rule) => (
            <tr key={rule.id}>
              {/* Label */}
              <td className="border p-2">
                <input
                  className="w-full border p-1"
                  value={rule.label}
                  onChange={(e) =>
                    updateRule(rule.id, { label: e.target.value })
                  }
                />
              </td>

              {/* Trigger Type */}
              <td className="border p-2">
                <select
                  className="w-full border p-1"
                  value={rule.trigger_type}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      trigger_type: e.target.value,
                      trigger_value: null, // reset when switching types
                    })
                  }
                >
                  {TRIGGER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </td>

              {/* Trigger Value (conditional) */}
              <td className="border p-2">
                {rule.trigger_type === "fraud_score_above" && (
                  <input
                    type="number"
                    className="w-full border p-1"
                    value={rule.trigger_value ?? ""}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        trigger_value: Number(e.target.value),
                      })
                    }
                  />
                )}

                {rule.trigger_type === "fraud_level_is" && (
                  <select
                    className="w-full border p-1"
                    value={rule.trigger_value ?? ""}
                    onChange={(e) =>
                      updateRule(rule.id, { trigger_value: e.target.value })
                    }
                  >
                    <option value="">Select level</option>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                )}

                {rule.trigger_type !== "fraud_score_above" &&
                  rule.trigger_type !== "fraud_level_is" && (
                    <span className="text-gray-400 italic">n/a</span>
                  )}
              </td>

              {/* Severity */}
              <td className="border p-2">
                <select
                  className="w-full border p-1"
                  value={rule.severity}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      severity: e.target.value as ModerationRule["severity"],
                    })
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </td>

              {/* Enabled */}
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) =>
                    updateRule(rule.id, { enabled: e.target.checked })
                  }
                />
              </td>

              {/* Delete */}
              <td className="border p-2 text-center">
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
