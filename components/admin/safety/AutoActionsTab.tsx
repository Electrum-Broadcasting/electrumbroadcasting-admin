"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AutoActionsTab() {
  const supabase = createBrowserClient();
    
  const [actions, setActions] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  // 🔹 Form now matches DB schema
  const [form, setForm] = useState({
  trigger_type: "moderation_rule",
  trigger_id: "",
  action_type: "auto_hide_story",
  scope_city_id: null,
  scope_category: "",
  enabled: true,
});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: actions } = await supabase
      .from("auto_actions")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: rules } = await supabase
      .from("moderation_rules")
      .select("id, label, severity, applies_to");

    setActions(actions || []);
    setRules(rules || []);
  }

  async function saveAction() {
  console.log("Saving action:", form);

  const res = await fetch("/api/admin/safety/auto-actions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: form }),
  });

  const json = await res.json();
  console.log("Server response:", json);

  if (!res.ok) {
    console.error("Save failed:", json.error);
    return;
  }

    setOpen(false);
     loadData();
    // reset form for next time
    setForm({
      trigger_type: "moderation_rule",
      trigger_id: "",
      action_type: "auto_hide_story",
      scope_city_id: null,
      scope_category: "",
      enabled: true,
    });
    loadData();
  }

  async function toggleEnabled(id: string, enabled: boolean) {
  const res = await fetch("/api/admin/safety/auto-actions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toggleId: id, toggleValue: enabled }),
  });

  if (!res.ok) {
    console.error("Toggle failed");
    return;
  }

  loadData();
}

  async function deleteAction(id: string) {
  const res = await fetch("/api/admin/safety/auto-actions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteId: id }),
  });

  if (!res.ok) {
    console.error("Delete failed");
    return;
  }

  loadData();
}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Auto-Actions</h2>
        <Button onClick={() => setOpen(true)}>Create Auto-Action</Button>
      </div>

      {/* Auto-Actions Table */}
      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Trigger Rule</th>
              <th className="p-2 text-left">Scope</th>
              <th className="p-2 text-left">Enabled</th>
              <th className="p-2 text-left">Delete</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.action_type}</td>
                <td className="p-2">
                  {rules.find((r) => r.id === a.trigger_id)?.label || "Unknown"}
                </td>
                <td className="p-2">
                  {a.scope_city_id || a.scope_category || "Global"}
                </td>
                <td className="p-2">
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={(v) => toggleEnabled(a.id, v)}
                  />
                </td>
                <td className="p-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAction(a.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Auto-Action Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Auto-Action</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Trigger Rule */}
            <div>
              <label className="block text-sm font-medium">Trigger Rule</label>
              <Select
  value={form.trigger_id}
  onValueChange={(v) => setForm({ ...form, trigger_id: v })}
>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rule" />
                </SelectTrigger>
                <SelectContent>
                  {rules.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label} ({r.severity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium">Action Type</label>
              <Select
                value={form.action_type}
                onValueChange={(v) => setForm({ ...form, action_type: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_hide_story">Auto Hide Story</SelectItem>
                  <SelectItem value="auto_escalate">Auto Escalate</SelectItem>
                  <SelectItem value="auto_notify_editor">Notify Editor</SelectItem>
                  <SelectItem value="auto_lock_contributor">Lock Contributor</SelectItem>
                  <SelectItem value="auto_archive">Archive Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
              <span>Enabled</span>
            </div>

            <Button
              disabled={!form.trigger_id}
              onClick={saveAction}
              className="w-full"
            >
              Save Auto-Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
