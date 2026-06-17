"use client";

import { useState } from "react";
import { FlagThresholds } from "@/lib/safety/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/components/ui/ToastProvider";

type Props = {
  initialValues: FlagThresholds;
};

export function FlagThresholdsForm({ initialValues }: Props) {
  const { showToast } = useToastContext();

  const [values, setValues] = useState<FlagThresholds>(initialValues);
  const [saving, setSaving] = useState(false);

  const onChange = (field: keyof FlagThresholds, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  };

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/safety/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_thresholds: values }),
      });

      if (!res.ok) {
        throw new Error("Failed to save safety settings");
      }

      showToast("Flag thresholds updated");
    } catch (err) {
      console.error(err);
      showToast("Error updating flag thresholds");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white border border-slate-200 rounded-lg p-4"
    >
      {/* AUTO-HIDE */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Auto-Hide Threshold</Label>
        <p className="text-xs text-slate-500">
          Number of flags before content is hidden from public view.
        </p>
        <Input
          type="number"
          min={1}
          value={values.auto_hide}
          onChange={(e) => onChange("auto_hide", e.target.value)}
          className="w-32"
        />
      </div>

      {/* ESCALATE CITY ADMIN */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Escalate to City Admin</Label>
        <p className="text-xs text-slate-500">
          Number of flags before the City Admin is notified.
        </p>
        <Input
          type="number"
          min={1}
          value={values.escalate_city_admin}
          onChange={(e) =>
            onChange("escalate_city_admin", e.target.value)
          }
          className="w-32"
        />
      </div>

      {/* AUTO FREEZE */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Auto-Freeze User</Label>
        <p className="text-xs text-slate-500">
          Number of flags before the user account is temporarily frozen.
        </p>
        <Input
          type="number"
          min={1}
          value={values.auto_freeze}
          onChange={(e) => onChange("auto_freeze", e.target.value)}
          className="w-32"
        />
      </div>

      {/* FRAUD REVIEW */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Fraud Review Trigger</Label>
        <p className="text-xs text-slate-500">
          Number of flags before the case is routed to Fraud Signals.
        </p>
        <Input
          type="number"
          min={1}
          value={values.fraud_review}
          onChange={(e) => onChange("fraud_review", e.target.value)}
          className="w-32"
        />
      </div>

      {/* ESCALATE CEO */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Escalate to CEO</Label>
        <p className="text-xs text-slate-500">
          Number of flags before the CEO is notified.
        </p>
        <Input
          type="number"
          min={1}
          value={values.escalate_ceo}
          onChange={(e) => onChange("escalate_ceo", e.target.value)}
          className="w-32"
        />
      </div>

      {/* SAFETY REVIEW */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Safety Review Trigger</Label>
        <p className="text-xs text-slate-500">
          Number of flags before the case is routed to Safety Review.
        </p>
        <Input
          type="number"
          min={1}
          value={values.safety_review}
          onChange={(e) => onChange("safety_review", e.target.value)}
          className="w-32"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={!isDirty || saving}>
          {saving ? "Saving…" : "Save thresholds"}
        </Button>
      </div>
    </form>
  );
}
