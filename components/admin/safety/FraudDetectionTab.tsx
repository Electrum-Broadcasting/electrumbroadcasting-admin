"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FraudDetectionTab() {
  const supabase = createBrowserClient();   
    
  const [rules, setRules] = useState<any[]>([]);

  // Load fraud rules
  async function loadRules() {
    const { data } = await supabase
      .from("fraud_rules")
      .select("*")
      .order("created_at", { ascending: true });

    setRules(data || []);
  }

  useEffect(() => {
    loadRules();
  }, []);

  // Add new rule
  function addRule() {
    const tempId = `temp-${crypto.randomUUID()}`;

    setRules([
      ...rules,
      {
        id: tempId,
        label: "",
        description: "",
        applies_to_signal_type: "",
        threshold_count: 1,
        threshold_window_minutes: 10,
        severity: "medium",
        enabled: true,
      },
    ]);
  }

  // Update rule
  function updateRule(id: string, field: string, value: any) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  // Delete rule (client-side only)
  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  // Save all rules
  async function saveRules() {
    const res = await fetch("/api/admin/safety/fraud-rules/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });

    console.log("Received fraud rules:", rules);

    const json = await res.json();

    if (!res.ok) {
      console.error("Save failed:", json.error);
      return;
    }

    loadRules();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fraud Rules</h2>
        <Button onClick={addRule}>Add Rule</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
                <TableHead>Signal Type</TableHead>
                <TableHead>Threshold Count</TableHead>
                <TableHead>Threshold Window (min)</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Input
                    value={rule.label}
                    onChange={(e) =>
                      updateRule(rule.id, "label", e.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <Input
                    value={rule.applies_to_signal_type}
                    onChange={(e) =>
                      updateRule(
                        rule.id,
                        "applies_to_signal_type",
                        e.target.value
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={rule.threshold_count}
                      onChange={(e) =>
                        updateRule(
                          rule.id,
                          "threshold_count",
                          Number(e.target.value)
                        )
                      }
                    />
                    <Input
                      type="number"
                      value={rule.threshold_window_minutes}
                      onChange={(e) =>
                        updateRule(
                          rule.id,
                          "threshold_window_minutes",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </TableCell>

                <TableCell>
                  <Select
                    value={rule.severity}
                    onValueChange={(v) =>
                      updateRule(rule.id, "severity", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) =>
                      updateRule(rule.id, "enabled", v)
                    }
                  />
                </TableCell>

                <TableCell>
                  <Button variant="ghost" onClick={() => deleteRule(rule.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    <div className="flex justify-end"></div>
      <Button onClick={saveRules}>Save Fraud Rules</Button>
    </div>
  );
}
