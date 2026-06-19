"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FraudSignalsTab() {
  const supabase = createBrowserClient();
    
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);
  const [openPayload, setOpenPayload] = useState(false);

  // Pagination
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  async function loadSignals() {
    setLoading(true);

    const { data, error } = await supabase
      .from("fraud_signals")
      .select("*, contributors(display_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && data) {
      setSignals(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSignals();
  }, [offset]);

  function openPayloadViewer(payload: any) {
    setSelectedPayload(payload);
    setOpenPayload(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fraud Signals</h2>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSignals}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Contributor</TableHead>
              <TableHead>Signal Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Score Impact</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {signals.map((sig) => (
              <TableRow key={sig.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(sig.created_at).toLocaleString()}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {sig.user_id || "—"}
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{sig.signal_type}</Badge>
                </TableCell>

                <TableCell>{sig.signal_value ?? "—"}</TableCell>

                <TableCell>
                  <Badge
                    variant={
                      sig.severity === "high"
                        ? "destructive"
                        : sig.severity === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {sig.severity}
                  </Badge>
                </TableCell>

                <TableCell>{sig.score_impact ?? 0}</TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => openPayloadViewer(sig.signal_payload)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {signals.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No fraud signals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </Button>
      </div>

      {/* Payload Viewer */}
      <Dialog open={openPayload} onOpenChange={setOpenPayload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Signal Payload</DialogTitle>
          </DialogHeader>

          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
            {JSON.stringify(selectedPayload, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
