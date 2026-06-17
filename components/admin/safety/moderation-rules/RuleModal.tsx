"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ModerationRule } from "@/lib/safety/types";
import { useToastContext } from "@/components/ui/ToastProvider";
import { nanoid } from "nanoid";

export function RuleModal({
  rule,
  onSave,
  onClose,
}: {
  rule: ModerationRule | null;
  onSave: (rule: ModerationRule) => void;
  onClose: () => void;
}) {
  const { showToast } = useToastContext();
  const isNew = !rule?.id;

  const [label, setLabel] = useState(rule?.label ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [severity, setSeverity] = useState<ModerationRule["severity"]>(rule?.severity ?? "low");
  const [appliesTo, setAppliesTo] = useState<ModerationRule["applies_to"]>(rule?.applies_to ?? "posts");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);

  function handleSave() {
    if (!label.trim()) {
      showToast("Label is required");
      return;
    }

    onSave({
      id: rule?.id ?? nanoid(),
      label,
      description,
      severity,
      applies_to: appliesTo,
      enabled,
      trigger_type: rule?.trigger_type ?? "keyword",
      trigger_value: rule?.trigger_value ?? "",
    });

    showToast(isNew ? "Rule created" : "Rule updated");
    onClose();
  }

  return (
    <Dialog open={!!rule} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Moderation Rule" : "Edit Moderation Rule"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Severity</label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Applies To</label>
            <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enabled</label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
