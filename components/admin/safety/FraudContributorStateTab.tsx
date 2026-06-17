"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FraudContributorStateTab() {
  const supabase = createBrowserClient();
    
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadState() {
    setLoading(true);

    const { data, error } = await supabase
      .from("fraud_contributor_state")
      .select(`
        *,
        contributors (
          display_name
        )
      `)
      .order("fraud_score", { ascending: false });

    if (!error && data) {
      setRows(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadState();
  }, []);

  function formatDate(ts: string | null) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contributor Fraud State</h2>
        <Button onClick={loadState} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead>Fraud Score</TableHead>
              <TableHead>Last Signal</TableHead>
              <TableHead>Last Rule Hit</TableHead>
              <TableHead>Locked?</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No contributor fraud state found.
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.contributors?.display_name || row.contributor_id}
                </TableCell>

                <TableCell>{row.fraud_score ?? 0}</TableCell>

                <TableCell>{formatDate(row.last_signal_at)}</TableCell>

                <TableCell>{formatDate(row.last_rule_hit_at)}</TableCell>

                <TableCell>{row.locked ? "Yes" : "No"}</TableCell>

                <TableCell>{row.locked_reason || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
