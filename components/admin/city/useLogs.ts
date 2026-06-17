"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToastContext } from "@/components/ui/ToastProvider";

export type OverrideLogRow = {
  id: string;
  created_at: string;
  admin_id: string | null;
  action: string;
  target_type: "contributor" | "story";
  target_id: string;
  metadata: any;
  city_id: string | null;
};

export function useLogs(cityId: string) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const { showToast } = useToastContext();

  const [logs, setLogs] = useState<OverrideLogRow[]>([]);

  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_override_logs")
      .select("*")
      .eq("city_id", cityId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("loadLogs error", error);
      showToast("Failed to load logs");
      return;
    }

    const normalized = (data || []).map((row: any) => ({
      ...row,
      target_type:
        row.target_type === "story" || row.target_type === "contributor"
          ? row.target_type
          : "contributor",
    }));

    setLogs(normalized);
  }, [supabase, cityId, showToast]);

  useEffect(() => {
    if (!cityId) return;
    loadLogs();
  }, [cityId, loadLogs]);

  return { logs, loadLogs };
}
